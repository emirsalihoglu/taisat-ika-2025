window.renderMapAndPath = function (mapJson, pathJson) {
    const map = JSON.parse(mapJson);
    const path = JSON.parse(pathJson);

    const canvas = document.getElementById("rvizCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ölçek
    const scale = 2;

    // === 1. OccupancyGrid çizimi ===
    if (map && map.data && map.info) {
        const width = map.info.width;
        const height = map.info.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x;
                const value = map.data[i];

                let color = "#777"; // bilinmeyen
                if (value === 0) color = "#fff";     // boş
                else if (value === 100) color = "#000"; // dolu

                ctx.fillStyle = color;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    // === 2. Path çizimi ===
    if (path && Array.isArray(path.poses)) {
        const poses = path.poses;

        // Path çizgisi
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();

        poses.forEach((pose, index) => {
            const x = pose.pose.position.x * scale;
            const y = pose.pose.position.y * scale;

            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // === 3. Başlangıç noktası ===
        const start = poses[0]?.pose?.position;
        if (start) {
            ctx.fillStyle = "lime";
            ctx.beginPath();
            ctx.arc(start.x * scale, start.y * scale, 5, 0, 2 * Math.PI);
            ctx.fill();
        }

        // === 4. Hedef noktası ===
        const goal = poses[poses.length - 1]?.pose?.position;
        if (goal) {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(goal.x * scale, goal.y * scale, 5, 0, 2 * Math.PI);
            ctx.fill();
        }

        // === 5. Yön oku (isteğe bağlı) ===
        const orientation = poses[0]?.pose?.orientation;
        if (orientation) {
            const angle = getYawFromQuaternion(orientation);
            const x = start.x * scale;
            const y = start.y * scale;
            const len = 15;

            ctx.strokeStyle = "orange";
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + len * Math.cos(angle), y + len * Math.sin(angle));
            ctx.stroke();
        }
    }
};

// Yardımcı: Quaternion → Yaw (Z ekseni rotasyonu)
function getYawFromQuaternion(q) {
    const { x, y, z, w } = q;
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    return Math.atan2(siny_cosp, cosy_cosp);
}