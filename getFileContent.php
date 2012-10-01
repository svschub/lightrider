<?php
    $fileName = $_POST["filename"];

    $file = fopen($fileName, "r");
    $content = fread($file, filesize($fileName));
    fclose($file);        

    echo $content;
?>
