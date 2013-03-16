<?php

namespace Projects\LightriderBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;


class MainController extends Controller
{
    public function indexAction()
    {
        return $this->render(
            'ProjectsLightriderBundle:Main:index.html.twig', 
             array()
        );
    }
}

?>
