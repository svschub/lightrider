<?php

namespace Projects\LightriderBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;


class ObjectLoaderController extends Controller
{
    public function indexAction()
    {
        $kernel = $this->get('kernel');

        $request = Request::createFromGlobals();
        if ($request->getMethod() !== 'GET') {
            throw $this->createNotFoundException('This page only receives GET requests.');
        }
        if (!$request->query->has('name')) {
            throw $this->createNotFoundException('The mandatory GET parameters are not specified.');
        }

        $objects = $this->readObjectsFromCsv(
            $kernel->locateResource('@ProjectsLightriderBundle/Resources/data/objects.csv')
        );

        $objectName = $request->query->get('name');
        if (!array_key_exists($objectName, $objects)) {
            throw $this->createNotFoundException("Object '$objectName' does not exist.");
        }

        $responseContent = $this->readObjectData($objectName, $objects, $kernel);
        if ($responseContent === '') {
            throw $this->createNotFoundException("Can not read Object '$objectName'.");
        }

        $response = new Response(); 
        $response->headers->set('Content-Type', 'text/plain');
        $response->setContent($responseContent);
        $response->setStatusCode(200);
        
        return $response;
    }

    private function readObjectsFromCsv($csvPath) {
		$objectsFile = fopen($csvPath, 'r') or die("can not read objects");
		while($columns = fgetcsv($objectsFile, 1024)) {
		    $objects[$columns[0]] = array(
		        "filename" => $columns[1],
		        "filetype" => $columns[2],
		    );
		}
		fclose($objectsFile) or die("can not close objects file");
        return $objects;
    }

    private function readObjectData($objectName, &$objects, &$kernel) {
		$object = $objects[$objectName];
		$filename = $object["filename"];
		$fileext = pathinfo($filename, PATHINFO_EXTENSION);
        $filepath = $kernel->locateResource('@ProjectsLightriderBundle/Resources/data/'.$filename);
        $objectData = "reading file: ".$filepath;

		$file = fopen($filepath, "r");
		$data = fread($file, filesize($filepath));
		fclose($file);

		if ($object["filetype"] == "ascii") {
		    $objectData = $data;
		} elseif ($object["filetype"] == "image") {
		    $mimeType = array(
		        "png" => "image/png",
		        "jpg" => "image/jpeg",
		    );
		    $objectData = "data:".$mimeType[$fileext].";base64,".base64_encode($data);
		}

        return $objectData;
    }
}
