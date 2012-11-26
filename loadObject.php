<?php
    if (!isset($_POST["name"]) || ($_POST["name"] == "")) {
        echo "Error: no object specified!";
        return;
    }

    $objects = array();
    $objectsFile = fopen('objects.csv', 'r') or die("can not read objects");
    while($columns = fgetcsv($objectsFile, 1024)) {
        $objects[$columns[0]] = array(
            "filename" => $columns[1],
            "filetype" => $columns[2],
        );
    }
    fclose($objectsFile) or die("can not close objects file");

    $objectName = $_POST["name"];
    if (!array_key_exists($objectName, $objects)) {
        echo "Error: object '$objectName' does not exist!";
        return;
    }

    $object = $objects[$objectName];
    $filename = $object["filename"];
    $fileext = pathinfo($filename, PATHINFO_EXTENSION);

    $file = fopen($filename, "r");
    $data = fread($file, filesize($filename));
    fclose($file);

    if ($object["filetype"] == "ascii") {
        echo $data;
    } elseif ($object["filetype"] == "image") {
        $mimeType = array(
            "png" => "image/png",
            "jpg" => "image/jpeg",
        );
        echo "data:".$mimeType[$fileext].";base64,".base64_encode($data);
    }
?>
