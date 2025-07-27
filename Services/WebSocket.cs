using System.Net.WebSockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.Json;

public class WebSocketService
{
    private ClientWebSocket? webSocket;
    private CancellationTokenSource? cts;
    private readonly Dictionary<string, Action<byte[]>> topicHandlers = new();

    public event Action<string>? OnStatusChanged;
    public event Action? OnConnected;

    public void RegisterHandler(string topic, Action<byte[]> handler)
    {
        topicHandlers[topic] = handler;
    }

    public async Task ConnectAsync(string uri)
    {
        try
        {
            cts = new();
            webSocket = new ClientWebSocket();
            await webSocket.ConnectAsync(new Uri(uri), cts.Token);

            OnStatusChanged?.Invoke("Connected");

            _ = Task.Run(ReceiveLoop);

            // 🔔 Otomatik abone olunacak topic listesi:
            var topics = new[]
            {
                "/my_robot/front_rgb_cam/image_color",
                "/my_robot/back_rgb_cam/image_color",
                "/my_robot/depth_camera/image",
                "/map",     // <-- Harita topic'i (ROS: nav_msgs/OccupancyGrid)
                "/my_robot/path",    // <-- Güzergah topic'i (ROS: nav_msgs/Path)
                "/my_robot/gps"               // <-- Buradan pozisyon (x,y) gelecek (Leaflet)
            };

            foreach (var topic in topics)
            {
                await SubscribeToTopic(topic);
            }

            OnConnected?.Invoke();
        }
        catch (Exception ex)
        {
            OnStatusChanged?.Invoke($"Error: {ex.Message}");
        }
    }

    private async Task SubscribeToTopic(string topic)
    {
        if (webSocket?.State == WebSocketState.Open)
        {
            var msg = new
            {
                op = "subscribe",
                topic = topic
            };

            string json = JsonSerializer.Serialize(msg);
            var bytes = Encoding.UTF8.GetBytes(json);

            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            Console.WriteLine($"📡 Subscribe message sent for: {topic}");
        }
    }

    public async Task DisconnectAsync()
    {
        if (webSocket != null)
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by user", CancellationToken.None);
            webSocket.Dispose();
            webSocket = null;
            OnStatusChanged?.Invoke("Disconnected");
        }
    }

    private async Task ReceiveLoop()
    {
        var buffer = new byte[65536];
        while (webSocket?.State == WebSocketState.Open)
        {
            try
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    OnStatusChanged?.Invoke("Disconnected by server");
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                    break;
                }

                var data = buffer[..result.Count];
                Console.WriteLine($"\n--- WebSocket mesajı alındı ---");
                Console.WriteLine($"Toplam byte: {result.Count}");

                string text = Encoding.UTF8.GetString(data);
                var match = Regex.Match(text, @"^topic:(.+?)\n");

                if (match.Success)
                {
                    string topic = match.Groups[1].Value;
                    var contentStart = Encoding.UTF8.GetByteCount(match.Value);
                    var content = data[contentStart..];

                    Console.WriteLine($"✔ Topic bulundu: {topic}, Boyut: {content.Length} byte");

                    if (topicHandlers.TryGetValue(topic, out var handler))
                        handler(content);
                    else
                        Console.WriteLine($"⚠️ Handler bulunamadı: {topic}");
                }
                else
                {
                    Console.WriteLine("❌ Topic prefix'i yok. Veri doğrudan gelmiş olabilir.");
                }
            }
            catch (Exception ex)
            {
                OnStatusChanged?.Invoke($"Receive error: {ex.Message}");
                Console.WriteLine($"🔥 Receive exception: {ex.Message}");
                break;
            }
        }
    }

    public async Task SendCommandAsync(string topic, string command)
    {
        if (webSocket?.State == WebSocketState.Open)
        {
            var msg = new
            {
                op = "publish",
                topic = topic,
                msg = new { command = command }
            };

            string json = JsonSerializer.Serialize(msg);
            var bytes = Encoding.UTF8.GetBytes(json);

            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            Console.WriteLine($"🚀 Command sent to {topic}: {command}");
        }
        else
        {
            Console.WriteLine("⚠️ WebSocket not connected.");
        }
    }
}