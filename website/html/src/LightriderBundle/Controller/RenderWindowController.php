<?php

namespace LightriderBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;


class RenderWindowController extends Controller
{
    public function indexAction()
    {
        return $this->render(
            'LightriderBundle:RenderWindow:index.html.twig', 
             array()
        );
    }
}

?>
