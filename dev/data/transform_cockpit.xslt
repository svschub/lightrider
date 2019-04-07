<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes" />

    <!-- This is an identity template - it copies everything
         that doesn't match another template -->
    <xsl:template match="@* | node()">
        <xsl:copy>
            <xsl:apply-templates select="@* | node()"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="ImageTexture/@url">
        <xsl:analyze-string select="." regex="^([^\s]+)">
            <xsl:matching-substring>
                <xsl:attribute name="url"><xsl:value-of select="regex-group(1)" /><xsl:text> </xsl:text><xsl:value-of select="regex-group(1)" /></xsl:attribute>
            </xsl:matching-substring>
        </xsl:analyze-string> 
    </xsl:template>

    <!-- Remove attribute sold from IndexedFaceSet nodes -->  
    <xsl:template match="Group[@DEF='group_ME_pitch_plane_sketch_mesh']/Shape/IndexedFaceSet/@solid" />
    <xsl:template match="Group[@DEF='group_ME_vor_plane_sketch_mesh']/Shape/IndexedFaceSet/@solid" />
    <xsl:template match="Group[@DEF='group_ME_roll_plane_sketch_mesh']/Shape/IndexedFaceSet/@solid" />

    <!-- Add attribute DEF="shape_display_plane_mesh" to display shape -->  
    <xsl:template match="Group[@DEF='group_ME_display_plane_mesh']/Shape">
        <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <xsl:attribute name="DEF">shape_display_plane_mesh</xsl:attribute>
            <xsl:apply-templates select="node()"/>
        </xsl:copy>
    </xsl:template>


    <!-- Change attributes emissiveColor and transparency of cross shape material, remove other color attributes -->  
    <xsl:template match="Group[@DEF='group_ME_cross_mesh']/Shape/Appearance/Material[@DEF='MA_cross_material']">
        <xsl:copy>
            <xsl:attribute name="DEF">MA_cross_material</xsl:attribute>
            <xsl:attribute name="emissiveColor">1.000 1.000 0.000</xsl:attribute>
            <xsl:attribute name="transparency">0.3</xsl:attribute>
            <xsl:apply-templates select="node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- Exchange IndexedFaceSet with IndexedLineSet for cross shape, change order of coordinates -->  
    <xsl:template match="Group[@DEF='group_ME_cross_mesh']/Shape/IndexedFaceSet">
        <xsl:element name="IndexedLineSet">
			<xsl:attribute name="coordIndex">0 3 -1 1 2 -1</xsl:attribute>
			<xsl:copy-of select="./*" />
        </xsl:element>
    </xsl:template>

    <!-- Change orientation of camera -->  
    <xsl:template match="Viewpoint[@DEF='CA_Camera']/@orientation">
         <xsl:attribute name="orientation">1.00 0.00 -0.02 0.00</xsl:attribute>
    </xsl:template>

</xsl:stylesheet>
