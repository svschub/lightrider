<?php

namespace Homepage\LightriderBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;


class MainController extends Controller
{
    public function indexAction()
    {
        return $this->render(
            'HomepageLightriderBundle:Main:index.html.twig', 
             array()
        );
    }
}

?>
