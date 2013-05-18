
Int_t n;

Double_t lambda_min = 380.0, lambda_max = 780.0;

Double_t * lambda;
Double_t dlambda=5.0;

Double_t * r;
Double_t * g;
Double_t * b; 

Double_t RR, GG, BB;


Double_t sqr(Double_t x) {
    return x*x;
}

Double_t integrate(Int_t n, Double_t * response, Double_t * distribution) {
    Double_t ret=0.0;
    for (Int_t i=0; i < n; i++) {
        ret += response[i]*distribution[i];
	}
	return ret*dlambda;
}

Double_t integrate_ext(Int_t n, Double_t * response, Double_t * distribution, Double_t * wavelength) {
    Double_t ret=0.0;
    for (Int_t i=1; i < n; i++) {
        ret += response[i]*distribution[i]*(wavelength[i]-wavelength[i-1]);
	}
	return ret;
}

Int_t populate(Int_t n, Double_t * x,  Double_t * y, Int_t n_add, Double_t * xadd, Double_t * nx, Double_t * ny) {
    Int_t i, j, k;
    Double_t delta;
	
    j = 0;
	k = 0;
    while ( (j < n_add) && (xadd[j] < x[0]) ) {
        nx[k] = xadd[j];
        ny[k] = 0.0;
        j++;
		k++;
    }

    nx[k] = x[0];
    ny[k] = y[0];
    k++;
	
    i = 1;
    while (i < n) {

        while ( (j < n_add) && (xadd[j] < x[i]) ) {
            delta = (xadd[j] - x[i-1])/(x[i] - x[i-1]);

            nx[k] = xadd[j];
            ny[k] = (1-delta)*y[i-1] + delta*y[i];

            j++;
            k++;
        }

        if ( (j >= n_add) || (xadd[j] > x[i]) ) {
            nx[k] = x[i];
            ny[k] = y[i];
            k++;
        }

        i++;
    }
	
	while (j < n_add) {
        nx[k] = xadd[j];
        ny[k] = 0.0;
	    j++;
        k++;
	}
	
	return k;
}

void shiftDistribution(Int_t n, Double_t * dist, Double_t shift, Double_t * rr, Double_t * gg, Double_t * bb) {
    Int_t n2;
	Double_t * lambda2 = new Double_t[2*n];
	Double_t * dist2 = new Double_t[2*n];
	Double_t * response2 = new Double_t[2*n];
	
	Double_t * lambda_shifted = new Double_t[n];

	for (Int_t i=0; i < n; i++) {
	    lambda_shifted[i] = shift*lambda[i];
	}
	n2 = populate(n,lambda_shifted,dist, n,lambda, lambda2,dist2);

	n2 = populate(n,lambda,r, n,lambda_shifted, lambda2,response2);
	*rr = integrate_ext(n2, response2, dist2, lambda2);

	n2 = populate(n,lambda,g, n,lambda_shifted, lambda2,response2);
	*gg = integrate_ext(n2, response2, dist2, lambda2);

	n2 = populate(n,lambda,b, n,lambda_shifted, lambda2,response2);
	*bb = integrate_ext(n2, response2, dist2, lambda2);
	
	delete[] lambda_shifted;
	
	delete[] response2;
	delete[] dist2;
	delete[] lambda2;
}
 
TGraph * getDist(TVectorD * v, TMatrixD * m) {
	Double_t * dist = new Double_t[n];
	
	cout << "vector RGB = (" << (*v)[0] << ", " << (*v)[1] << ", " << (*v)[2] << ")" << endl; 
	*v *= *m;

	for (int i=0; i < n; i++) {
	    dist[i] = (*v)[0]*r[i] + (*v)[1]*g[i] + (*v)[2]*b[i];
	}
	

	cout << "R = " << integrate(n, r, dist) << endl;
	cout << "G = " << integrate(n, g, dist) << endl;
	cout << "B = " << integrate(n, b, dist) << endl;

	TGraph * gret = new TGraph(n, lambda, dist);
	gret->SetLineWidth(2);
	
	delete[] dist;
	
	return gret;
}

void drawLine(UInt_t * argb, Int_t img_w, Int_t col, Int_t row, Int_t length,  UInt_t r, UInt_t g, UInt_t b) {
    UInt_t argbval = 0xFF000000 + (r << 16) + (g << 8) + b;
    for (Int_t i=0; i < length; i++) {
	    argb[(row+i)*img_w + col] = argbval;
	}
}

Double_t rescale(Double_t v, Double_t vmin, Double_t vmax) {
	return (v-vmin)/(vmax-vmin);
}

Int_t rgbbase() {
    n = 100;

    lambda = new Double_t[n];
    dlambda = 5; 
	
    r = new Double_t[n];
    g = new Double_t[n];
    b = new Double_t[n];
	
    FILE * f = fopen("rgb31.txt", "r");
    Int_t i = 0;
	while (fscanf(f, "%lf %le %le %le", &lambda[i], &r[i], &g[i], &b[i]) == 4) {
 	    i++;
	}
	fclose(f);
    n = i;

	cout << "result = " << integrate(n, r, b)/dlambda << endl;

    TMatrixD *m = new TMatrixD(3,3);

	(*m)(0,0) = integrate(n, r,r);
	(*m)(0,1) = integrate(n, r,g);
	(*m)(0,2) = integrate(n, r,b);

	(*m)(1,0) = integrate(n, g,r);
	(*m)(1,1) = integrate(n, g,g);
	(*m)(1,2) = integrate(n, g,b);
	
	(*m)(2,0) = integrate(n, b,r);
	(*m)(2,1) = integrate(n, b,g);
	(*m)(2,2) = integrate(n, b,b);

	m->Invert();
	
	TVectorD *v = new TVectorD(3);

	(*v)[0] = 1.0;
	(*v)[1] = 0.0;
	(*v)[2] = 0.0;
	TGraph * gr = getDist(v, m);
	gr->SetLineColor(2);
	gr->SetTitle("Distribution for R, G, B");
	gr->GetXaxis()->SetTitle("wave length #lambda [nm]");
	gr->Draw("AL");
    gr->GetYaxis()->SetRangeUser(-0.04, 0.1);

    (*v)[0] = 0.0;
	(*v)[1] = 1.0;
	(*v)[2] = 0.0;
	TGraph * gg = getDist(v, m);
	gg->SetLineColor(3);
	gg->Draw("L,same");
	
	(*v)[0] = 0.0;
	(*v)[1] = 0.0;
	(*v)[2] = 1.0;
	TGraph * gb = getDist(v, m);
	gb->SetLineColor(4);
	gb->Draw("L,same");
	

	Int_t nn=512;

    Double_t * shift = new Double_t[nn];	
    Double_t * shR = new Double_t[nn];
    Double_t * shG = new Double_t[nn];
    Double_t * shB = new Double_t[nn];
	
	Double_t shift_min = lambda_min/lambda_max;
	Double_t shift_max = lambda_max/lambda_min;
	
	for (Int_t i=0; i < nn; i++) {
        shift[i] = shift_min + i*(shift_max - shift_min)/(nn-1);
	    shiftDistribution(gb->GetN(), gb->GetY(), shift[i], &shR[i], &shG[i], &shB[i]);
	}
	
    TCanvas * cvsh = new TCanvas("cvsh", "shifted B");

	TGraph * gshR = new TGraph(nn, shift, shR);
	gshR->SetTitle("B Channel Shift");
	gshR->GetXaxis()->SetTitle("shift");
	gshR->SetLineColor(2);
	gshR->SetLineWidth(2);
	gshR->Draw("AL");
	
	TGraph * gshG = new TGraph(nn, shift, shG);
	gshG->SetLineColor(3);
	gshG->SetLineWidth(2);
	gshG->Draw("L,same");
	
	TGraph * gshB = new TGraph(nn, shift, shB);
	gshB->SetLineColor(4);
	gshB->SetLineWidth(2);
	gshB->Draw("L,same");

	FILE * file = fopen("bshift.lst", "w");
	for (Int_t i=0; i < nn; i++) {
	    fprintf(file, "%lf    %lf    %lf    %lf\n", shift[i], shR[i], shG[i], shB[i]);
	}
	fclose(file);

	delete[] shB;
	delete[] shG;
	delete[] shR;
	delete[] shift;

	delete m;
	delete v;
	
	delete[] b;
	delete[] g;
	delete[] r;
	delete[] lambda;

    return 0;
}
