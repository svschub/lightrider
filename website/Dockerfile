FROM ubuntu:14.04

ARG DEBIAN_FRONTEND=noninteractive
ARG SYMFONY_VERSION=2.3

# Install packages:
RUN \
  apt-get -q update && \
  apt-get -y -q install supervisor apache2 curl && \
  apt-get -y -q install php5 php5-cli php5-mcrypt php5-intl libapache2-mod-php5 && \
  rm -rf /var/lib/apt/lists/*

# Enable Apache and PHP modules:
RUN \
  php5enmod mcrypt && \
  a2enmod rewrite

# Add Apache and PHP configuration:
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
ADD config/apache2/000-default.conf /etc/apache2/sites-available/000-default.conf
ADD config/php5/apache2/php.ini /etc/php5/apache2/
ADD config/php5/cli/php.ini /etc/php5/cli/
ADD config/supervisor/*.conf /etc/supervisor/conf.d/


# Install Symfony 2 and add LightriderBundle:
RUN \
  curl -LsS http://symfony.com/installer -o /usr/local/bin/symfony && \
  chmod a+x /usr/local/bin/symfony && \
  cd /var/www/ && symfony -q new lightrider "$SYMFONY_VERSION" && \
  cd /var/www/lightrider && php app/console generate:bundle -q --no-interaction --namespace=LightriderBundle --dir=src && \
  rm -r /var/www/lightrider/src/LightriderBundle && \
  mkdir -p /var/www/lightrider/web/public/ && \
  chown -R www-data:www-data /var/www/lightrider/

# Add routing.yml and source files for LightriderBundle: 
ADD html/app/config/routing.yml /var/www/lightrider/app/config/routing.yml
ADD html/src/LightriderBundle /var/www/lightrider/src/LightriderBundle

# Set permissions and symlink:
RUN \
  chown -R www-data:www-data /var/www/lightrider/app/config && \
  chown -R www-data:www-data /var/www/lightrider/src/LightriderBundle && \
  cd /var/www/lightrider/web/public/ && ln -s ../../src/LightriderBundle/Resources/public lightrider 


VOLUME /var/www/lightrider/app/cache
VOLUME /var/log/apache2

EXPOSE 80

ENTRYPOINT ["/usr/bin/supervisord"]
