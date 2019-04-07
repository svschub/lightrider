FROM ubuntu:14.04

ARG DEBIAN_FRONTEND=noninteractive

RUN \
  apt-get -q update && \
  apt-get -y -q install supervisor apache2  && \
  apt-get -y -q install php5 php5-mcrypt php5-intl libapache2-mod-php5 && \
  rm -rf /var/lib/apt/lists/*

RUN \
  php5enmod mcrypt && \
  a2enmod rewrite

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
ADD config/apache2/000-default.conf /etc/apache2/sites-available/000-default.conf
ADD config/supervisor/*.conf /etc/supervisor/conf.d/

ADD html /var/www/html
RUN chown -R www-data:www-data /var/www/html

VOLUME /var/www/html/app/cache
VOLUME /var/log/apache2

EXPOSE 80

ENTRYPOINT ["/usr/bin/supervisord"]
