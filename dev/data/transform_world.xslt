<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes" />

    <!-- This is an identity template - it copies everything
         that doesn't match another template -->
    <xsl:template match="@* | node()">
        <xsl:copy>
            <xsl:apply-templates select="@* | node()"/>
        </xsl:copy>
    </xsl:template>


    <!-- Change intensity attributes of directional lights -->

    <xsl:template match="DirectionalLight[@DEF='LA_Sun']/@intensity">
         <xsl:attribute name="intensity">1.0</xsl:attribute>
    </xsl:template>

    <xsl:template match="DirectionalLight[@DEF='LA_Sun2']/@intensity">
         <xsl:attribute name="intensity">0.75</xsl:attribute>
    </xsl:template>

    <xsl:template match="DirectionalLight[@DEF='LA_Sun3']/@intensity">
         <xsl:attribute name="intensity">0.7</xsl:attribute>
    </xsl:template>


    <!-- Change orientation of camera -->  
    <xsl:template match="Viewpoint[@DEF='CA_Camera']/@orientation">
         <xsl:attribute name="orientation">0.59 -0.59 -0.55 0.00</xsl:attribute>
    </xsl:template>

</xsl:stylesheet>
