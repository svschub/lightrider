<?php

namespace Homepage\LightriderBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;


class ObjectLoaderController extends Controller {
    public function indexAction($scope, $filename) {
        $request = Request::createFromGlobals();

        if (!$request->isXmlHttpRequest()) {
//            throw new AccessDeniedHttpException('This page only receives AJAX requests.');
        }

        if ($request->getMethod() !== 'GET') {
            throw new AccessDeniedHttpException('This page only receives GET requests.');
        }

        if (empty($scope) || empty($filename)) {
            throw $this->createNotFoundException('Invalid object requested.');
        }

        $objectFilePath = $this->getObjectFilePath($scope, $filename);
        if (empty($objectFilePath)) {
            throw $this->createNotFoundException("Object '{$scope}/{$filename}' not found.");
        }

        $objectMimeType = $this->getMimeTypeOfFile(basename($objectFilePath));

        $objectContent = $this->getObjectContent($objectFilePath);

        $response = new Response();
        $response->headers->set('Content-Type', $objectMimeType);
        $response->setContent($objectContent);
        $response->setStatusCode(200);

        return $response;
    }

    private function getObjectFilePath($requestedObjectScope, $requestedObjectName) {
        $kernel = $this->get('kernel');

        $objectsFilePath = $kernel->locateResource('@HomepageLightriderBundle/Resources/data/objects.csv');

        $relObjectPath = '';
        $objectsFile = fopen($objectsFilePath, 'r') or die("can not read objects");
        while ($objectRow = fgetcsv($objectsFile, 1024)) {
            if (empty($objectRow)) {
                continue;
            }

            $objectName = $objectRow[0];
            $objectScope = $objectRow[1];
            if ($objectScope = $requestedObjectScope && $objectName == $requestedObjectName) {
                $relObjectPath = $objectRow[2];
                break;
            }
        }
        fclose($objectsFile) or die("can not close objects file");

        if (!empty($relObjectPath)) {
            $objectFilePath = $kernel->locateResource('@HomepageLightriderBundle/Resources/data/' . $relObjectPath);
        } else {
            $objectFilePath = null;
        }

        return $objectFilePath;
    }

    private function getObjectContent($objectFilePath) {
        $objectFile = fopen($objectFilePath, "r");
        $objectContent = fread($objectFile, filesize($objectFilePath));
        fclose($objectFile);

        return $objectContent;
    }

    private function getMimeTypeOfFile($fileName) {
        // some standard MIME types:
        $mimeTypes = array(
            'txt' => 'text/plain',
            'csv' => 'text/comma-separated-values',
            'htm,html' => 'text/html',
            'xml' => 'application/xml', // 'text/xml'
            'x3d' => 'application/xml',
            'vs' => 'x-shader/x-vertex',
            'fs' => 'x-shader/x-fragment',
            'gif' => 'image/gif',
            'png' => 'image/png',
            'jpg,jpeg' => 'image/jpeg',
            'zip' => 'application/zip',
            'gz' => 'application/gzip',
            'tar' => 'application/x-tar',
            'pdf' => 'application/pdf',
            'swf' => 'application/x-shockwave-flash',
            'js' => 'application/javascript', // 'text/javascript'
        );

        // check, if the MIME type of the file is in the list:
        $fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
        foreach ($mimeTypes as $fileExtensionsList => $mimeType) {
            $fileExtensions = explode(',', $fileExtensionsList);
            if (in_array($fileExt, $fileExtensions)) {
                // file extension found in list, return corresponding MIME type:
                return $mimeType;
            }
        }

        // file extension not found in list, return default MIME type:
        return $mimeTypes['txt'];
    }
}
