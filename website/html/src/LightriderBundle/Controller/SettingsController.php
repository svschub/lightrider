<?php

namespace Homepage\LightriderBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;


class SettingsController extends Controller
{
    public function indexAction(Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
//            throw new AccessDeniedHttpException('This page only receives AJAX requests.');
        }

        if ($request->getMethod() !== 'GET') {
            throw new AccessDeniedHttpException('This page only receives GET requests.');
        }

        if ($request->query->has('is_mobile')) {
            $isMobile = ($request->query->get('is_mobile') != 0);
        } else {
            $isMobile = false;
        }

        if ($isMobile) {
            $renderedSettings = $this->renderMobileSettings();
        } else {
            $renderedSettings = $this->renderDesktopSettings($request);
        }

        return $renderedSettings;
    }

    private function renderDesktopSettings($request)
    {
        return $this->render(
            'HomepageLightriderBundle:Settings:desktop_settings.html.twig', 
             array()
        );
    }

    private function renderMobileSettings()
    {
        return $this->render(
            'HomepageLightriderBundle:Settings:mobile_settings.html.twig', 
             array()
        );
    }
}

?>
