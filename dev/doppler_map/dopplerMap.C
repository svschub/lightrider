
Double_t lambda_min = 380.0, lambda_max = 780.0;

void drawLine(UInt_t * argb, Int_t img_w, Int_t col, Int_t row, Int_t length,  UInt_t r, UInt_t g, UInt_t b) {
    UInt_t argbval = 0xFF000000 + (r << 16) + (g << 8) + b;
    for (Int_t i=0; i < length; i++) {
	    argb[(row+i)*img_w + col] = argbval;
	}
}

Double_t rescale(Double_t v, Double_t vmin, Double_t vmax) {
	return (v-vmin)/(vmax-vmin);
}

Int_t dopplerMap() {	
	Int_t nn=512;

    Double_t * shR = new Double_t[nn];
    Double_t * shG = new Double_t[nn];
    Double_t * shB = new Double_t[nn];
	
	Double_t shift_min = lambda_min/lambda_max;
	Double_t shift_max = lambda_max/lambda_min;
		
	Int_t img_w=nn,line_h=16,img_h=3*line_h;
    TCanvas * cv3 = new TCanvas("cv3", "Doppler Map", img_w+4, img_h+4+24);
	cv3->SetMargin(0,0,0,0);
	cv3->SetFrameBorderMode(0);
	cv3->SetFrameBorderSize(0);
	cv3->SetBorderMode(0);
	cv3->SetBorderSize(0);

	TASImage * image = new TASImage(img_w, img_h);
	UInt_t * argb = image->GetArgbArray();
	Int_t imagesize = img_w*img_h;

	FILE * file;
	char * filename[] = {"rshift.lst", "gshift.lst", "bshift.lst"};
	Int_t i, j;
    Double_t shiftv;
	Double_t rv, rv_min=0.0, rv_max=0.0;
	Double_t gv, gv_min=0.0, gv_max=0.0;
	Double_t bv, bv_min=0.0, bv_max=0.0;

	for (j=0; j < 3; j++) {
	    file = fopen(filename[j], "r");
	    i = 0;
	    while (fscanf(file, "%lf %lf %lf %lf", &shiftv, &rv, &gv, &bv) == 4) {
            if (rv < rv_min) rv_min = rv;			
            if (rv > rv_max) rv_max = rv;

            if (gv < gv_min) gv_min = gv;			
            if (gv > gv_max) gv_max = gv;

            if (bv < bv_min) bv_min = bv;			
            if (bv > bv_max) bv_max = bv;

            i++;    
	    }	
        fclose(file);

	}	

	cout << "R(" << rv_min << ", " << rv_max << ")" << endl;
	cout << "G(" << gv_min << ", " << gv_max << ")" << endl;
	cout << "B(" << bv_min << ", " << bv_max << ")" << endl;

	for (j=0; j < 3; j++) {
	    file = fopen(filename[j], "r");
	    i = 0;
	    while (fscanf(file, "%lf %lf %lf %lf", &shiftv, &rv, &gv, &bv) == 4) {
	        shR[i] = rv;			
		    shG[i] = gv; 
		    shB[i] = bv;		
            i++;    
	    }	
        fclose(file);
	    nn = i;
				
		for (i=0; i < nn; i++) {
            drawLine(argb, img_w, i, j*line_h, line_h-2,  
			    255*rescale(shR[i], rv_min, rv_max), 
				255*rescale(shG[i], gv_min, gv_max), 
				255*rescale(shB[i], bv_min, bv_max)
			);
		}
	}
	
	image->Draw();
    cv3->SaveAs("DopplerMap.png");

	delete[] shB;
	delete[] shG;
	delete[] shR;

    return 0;
}
