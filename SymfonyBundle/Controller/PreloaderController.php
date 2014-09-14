<?php

namespace Homepage\LightriderBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;


class PreloaderController extends Controller
{
    public function indexAction(Request $request)
    {
        return $this->render(
            'HomepageLightriderBundle:Preloader:index.html.twig', 
             array(
                 'is_mobile' => $this->isMobileDevice($request) ? 1 : 0
             )
        );
    }

    private function isMobileDevice($request)
    {
        $userAgent = $request->headers->get('User-Agent');

        $isMobile = (preg_match('/(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i', $userAgent) == 1);

        return $isMobile;
    }
}

?>
