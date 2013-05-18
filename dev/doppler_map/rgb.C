
Int_t n;

Double_t * lambda;
Double_t dlambda;

Double_t * r;
Double_t * g;
Double_t * b; 

Double_t RR, GG, BB;


Double_t integrate(Int_t n, Double_t * response, Double_t * distribution) {
    Double_t ret=0.0;
    for (Int_t i=0; i < n; i++) {
        ret += response[i]*distribution[i];
	}
	return ret;
}

Double_t sqr(Double_t x) {
    return x*x;
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

Double_t integrate_ext(Int_t n, Double_t * response, Double_t * distribution, Double_t * wavelength) {
    Double_t ret=0.0;
    for (Int_t i=1; i < n; i++) {
        ret += response[i]*distribution[i]*(wavelength[i]-wavelength[i-1]);
	}
	return ret;
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
 
void fcn(Int_t &npar, Double_t *gin, Double_t &f, Double_t *par, Int_t iflag) {
    Double_t mean = par[0];
	Double_t width = par[1];
	Double_t norm = par[2];
	
	Double_t gaus;
	Double_t lr=0.0, lg=0.0, lb=0.0;	
    for (Int_t i=0; i < n; i++) {
        distr = TMath::Gaus(lambda[i], mean, width, norm);
   	    lr += r[i]*distr;
        lg += g[i]*distr;
        lb += b[i]*distr;
	}
	
	f = sqr(RR-lr) + sqr(GG-lg) + sqr(BB-lb);
}

void getRGBfromDistribution() {
	Double_t * distr = new Double_t[n];
	Double_t * rx = new Double_t[n];
	Double_t * gx = new Double_t[n];
	Double_t * bx = new Double_t[n];

	Double_t rx_max=0.0, gx_max=0.0, bx_max=0.0;
	Double_t rx_max_wl, gx_max_wl, bx_max_wl;

	for (Int_t j=0; j < n; j++) {
   	    for (Int_t i=0; i < n; i++) distr[i] = TMath::Gaus(lambda[i], lambda[j], 50.0, 1.0);
	    rx[j] = integrate(n, r, distr)*dlambda;
		if (rx[j] > rx_max) { rx_max = rx[j]; rx_max_wl = lambda[j]; }
	    gx[j] = integrate(n, g, distr)*dlambda;
		if (gx[j] > gx_max) { gx_max = gx[j]; gx_max_wl = lambda[j]; }
	    bx[j] = integrate(n, b, distr)*dlambda;
 		if (bx[j] > bx_max) { bx_max = bx[j]; bx_max_wl = lambda[j]; }
    }
    cout << "R(max) = " << rx_max << " at " << rx_max_wl << endl;
    cout << "G(max) = " << gx_max << " at " << gx_max_wl << endl;
    cout << "B(max) = " << bx_max << " at " << bx_max_wl << endl;
	
	TCanvas * cv2 = new TCanvas("cv2", "RGB Values");

    TGraph * grx = new TGraph(n, lambda, rx);
    grx->SetTitle("RGB Value");
	grx->GetXaxis()->SetTitle("Wavelength #lambda [nm]");
    grx->SetLineWidth(2);
    grx->SetLineColor(2);
	grx->Draw("AL");

    TGraph * ggx = new TGraph(n, lambda, gx);
    ggx->SetLineWidth(2);
    ggx->SetLineColor(3);
	ggx->Draw("L,same");

    TGraph * gbx = new TGraph(n, lambda, bx);
    gbx->SetLineWidth(2);
    gbx->SetLineColor(4);
	gbx->Draw("L,same");
    
	delete[] bx;
	delete[] gx;
	delete[] rx;
	delete[] distr;
}

void fitDistribution() {
    // 610, 545, 455
	RR = 0.0;
	GG = 1.0;  
	BB = 0.0;

    TMinuit * gMinuit = new TMinuit(3);
    gMinuit->SetFCN(fcn);

    Double_t arglist[10];
    Int_t ierflg = 0;

    arglist[0] = 1;
    gMinuit->mnexcm("SET ERR", arglist, 1, ierflg);

    // Set starting values and step sizes for parameters
    gMinuit->mnparm(0, "mean", 545.0, 0.1, 0,0,ierflg);
    gMinuit->mnparm(1, "width", 100.0, 0.1, 0,0,ierflg);
    gMinuit->mnparm(2, "norm", 1.0, 0.1, 0,0,ierflg);

    // Now ready for minimization step
    arglist[0] = 500;
    arglist[1] = 1.;
    gMinuit->mnexcm("MIGRAD", arglist, 2, ierflg);

    // Print results
    Double_t amin,edm,errdef;
    Int_t nvpar,nparx,icstat;
    gMinuit->mnstat(amin,edm,errdef,nvpar,nparx,icstat);
   
    delete gMinuit;	
}

Double_t blackbody(Double_t wavelength, Double_t T) {
	Double_t c=299792458.0;  // [m/s]
	Double_t k=1.3806488e-23;  // [J/K]
	Double_t h=6.62606957e-34;  // [J*s]
	Double_t f=1.0e9*c/wavelength;
    return ( 2*TMath::Pi()*h/(c*c*c) * f*f*f*f*f/(TMath::Exp(h*f/(k*T))-1.0) );
}

TGraph * blackbodyGraph(Double_t temperature) {
    Double_t * x = new Double_t[n];
    Double_t * y = new Double_t[n];

    Double_t x0 = 100.0;
    Double_t dx = 40;
	
	for (Int_t i=0; i < n; i++) {
        x[i] = x0 + i*dx;
 	    y[i] = blackbody(x[i], temperature);
    }

    TGraph * ret = new TGraph(n, x, y);
	ret->SetLineWidth(2);

	delete[] y;
	delete[] x;

	return ret;
}

void blackbodyplot(Double_t temperature) {
	TCanvas * cv3 = new TCanvas("cv3", "Blackbody Radiation");
	
	TGraph * g4000 = blackbodyGraph(5000);
	g4000->SetTitle("Blackbody Radiation");
	g4000->GetXaxis()->SetTitle("Wavelength #lambda [nm]");
	g4000->SetLineColor(1);
	g4000->Draw("AL");

	TGraph * g3000 = blackbodyGraph(4000);
	g3000->SetLineColor(4);
	g3000->Draw("L,same");

	TGraph * g3000 = blackbodyGraph(3000);
	g3000->SetLineColor(2);
	g3000->Draw("L,same");

}

void getRGBfromBBDistribution() {
	Double_t * distr = new Double_t[n];
	Double_t * rx = new Double_t[n];
	Double_t * gx = new Double_t[n];
	Double_t * bx = new Double_t[n];
	
	Double_t * temp = new Double_t[n];
	Double_t Ta = 500.0;
	Double_t Tb = 10000.0;
	Double_t dT = (Tb-Ta)/(n-1);
	
	for (Int_t j=0; j < n; j++) {
        temp[j] = Ta + j*dT;
		
  	    for (Int_t i=0; i < n; i++) distr[i] = blackbody(lambda[i], temp[j]);
	    rx[j] = integrate(n, r, distr)*dlambda;
	    gx[j] = integrate(n, g, distr)*dlambda;
	    bx[j] = integrate(n, b, distr)*dlambda;
	}

	TCanvas * cv2 = new TCanvas("cv2", "RGB Values (BB)");

    TGraph * grx = new TGraph(n, temp, rx);
    grx->SetTitle("RGB Values");
	grx->GetXaxis()->SetTitle("Temperature [K]");
    grx->SetLineWidth(2);
    grx->SetLineColor(2);
	grx->Draw("AL");

    TGraph * ggx = new TGraph(n, temp, gx);
    ggx->SetLineWidth(2);
    ggx->SetLineColor(3);
	ggx->Draw("L,same");

    TGraph * gbx = new TGraph(n, temp, bx);
    gbx->SetLineWidth(2);
    gbx->SetLineColor(4);
	gbx->Draw("L,same");
    
	delete[] temp;
	delete[] bx;
	delete[] gx;
	delete[] rx;
	delete[] distr;
}

Int_t rgb() {
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
		
	TCanvas * cv1 = new TCanvas("cv1", "RGB Color Matching Functions");

    TGraph * gr = new TGraph(n, lambda, r);
    gr->SetTitle("RGB Color Matching Functions");
	gr->GetXaxis()->SetTitle("Wavelength #lambda [nm]");
    gr->SetLineWidth(3);
    gr->SetLineColor(2);
	gr->Draw("AL");

    TGraph * gg = new TGraph(n, lambda, g);
    gg->SetLineWidth(3);
    gg->SetLineColor(3);
	gg->Draw("L,same");

    TGraph * gb = new TGraph(n, lambda, b);
    gb->SetLineWidth(3);
    gb->SetLineColor(4);
	gb->Draw("L,same");

	getRGBfromBBDistribution();
	
//    getRGBfromDistribution();

//    fitDistribution();
	
	blackbodyplot(4000.0);
		
	delete[] b;
	delete[] g;
	delete[] r;
	delete[] lambda;
	
    return 0;
}
