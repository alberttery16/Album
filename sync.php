<?php
/**
 * Sincronizador del Álbum con Auto-Renombrado
 * Renombra archivos nuevos a img_N o vid_N y mantiene los datos de data.json
 */

$dir = 'assets/';
$outputFile = 'data.json';

if (!is_dir($dir)) mkdir($dir, 0777, true);

// 1. Cargar datos actuales
$existingData = [];
if (file_exists($outputFile)) {
    $currentJson = json_decode(file_get_contents($outputFile), true);
    if (is_array($currentJson)) {
        foreach ($currentJson as $item) {
            $existingData[$item['src']] = $item;
        }
    }
}

// 2. Encontrar el índice máximo actual para seguir la numeración
$files = scandir($dir);
$maxImg = 0;
$maxVid = 0;
foreach ($files as $file) {
    if (preg_match('/^img_(\d+)\./', $file, $matches)) {
        $maxImg = max($maxImg, (int)$matches[1]);
    }
    if (preg_match('/^vid_(\d+)\./', $file, $matches)) {
        $maxVid = max($maxVid, (int)$matches[1]);
    }
}

// 3. Renombrar archivos que no siguen el patrón
foreach ($files as $file) {
    if ($file === '.' || $file === '..' || strpos($file, '.') === 0) continue;
    if ($file === 'QR_Album.png') continue;
    
    $oldPath = $dir . $file;
    $ext = strtolower(pathinfo($oldPath, PATHINFO_EXTENSION));
    
    // Si ya está bien nombrado, saltar
    if (preg_match('/^(img|vid)_\d+\./', $file)) continue;

    $newName = '';
    if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        $maxImg++;
        $newName = "img_{$maxImg}.{$ext}";
    } elseif (in_array($ext, ['mp4', 'mov', 'webm'])) {
        $maxVid++;
        $newName = "vid_{$maxVid}.{$ext}";
    }

    if ($newName) {
        $newPath = $dir . $newName;
        if (rename($oldPath, $newPath)) {
            echo "Renombrado: $file -> $newName\n";
            // Actualizar referencia en los datos cargados
            if (isset($existingData[$oldPath])) {
                $item = $existingData[$oldPath];
                $item['src'] = $newPath;
                // Si el caption era el autogenerado feo, lo limpiamos
                if (strpos($item['caption'], 'Nuevo Momento') !== false) {
                    $item['caption'] = (in_array($ext, ['mp4', 'mov', 'webm']) ? "Vídeo $maxVid" : "Foto $maxImg");
                }
                unset($existingData[$oldPath]);
                $existingData[$newPath] = $item;
            }
        }
    }
}

// 4. Regenerar la lista final para data.json
$files = scandir($dir);
$newData = [];

foreach ($files as $file) {
    if ($file === '.' || $file === '..' || strpos($file, '.') === 0) continue;
    if ($file === 'QR_Album.png') continue;
    
    $path = $dir . $file;
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        $type = 'img';
    } elseif (in_array($ext, ['mp4', 'mov', 'webm'])) {
        $type = 'vid';
    } else continue;

    if (isset($existingData[$path])) {
        $item = $existingData[$path];
        $item['id'] = count($newData) + 1; // ID secuencial limpio
        
        // Limpiar caption si todavía tiene el formato "Nuevo Momento"
        if (strpos($item['caption'], 'Nuevo Momento') !== false) {
            preg_match('/_(\d+)\./', $file, $m);
            $num = isset($m[1]) ? $m[1] : count($newData) + 1;
            $item['caption'] = ($type === 'img' ? "Foto $num" : "Vídeo $num");
        }
        
        $newData[] = $item;
    } else {
        // Nuevo archivo (si quedara alguno sin procesar arriba)
        preg_match('/_(\d+)\./', $file, $m);
        $num = isset($m[1]) ? $m[1] : count($newData) + 1;
        
        $newData[] = [
            'id' => count($newData) + 1,
            'type' => $type,
            'category' => 'modern', // Default category for new cars
            'src' => $path,
            'caption' => ($type === 'img' ? "Foto $num" : "Vídeo $num"),
            'date' => date("F Y")
        ];
    }
}

// 5. Guardar JSON
file_put_contents($outputFile, json_encode($newData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "¡Sincronización y renombrado completado!\n";
?>
