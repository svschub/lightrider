
Double_t getBoostedAngle(Double_t angle, Double_t beta) {
    // angle: inside the moving system
    // boostedAngle: inside the reference system
    Double_t gamma = 1/TMath::Sqrt(1-beta*beta);
    Double_t boostedAngle = TMath::ATan( TMath::Sin(angle) / (gamma*(TMath::Cos(angle)-beta)) );
    if (boostedAngle < 0.0) boostedAngle += TMath::Pi();
    return boostedAngle;
}

Double_t getShift(Double_t angle, Double_t beta) {
    Double_t gamma = 1/TMath::Sqrt(1-beta*beta);
    Double_t tanAngleRef = TMath::Sin(angle) / (gamma*(TMath::Cos(angle)-beta));
	Double_t cosAngleRef = 1.0/sqrt(tanAngleRef*tanAngleRef+1.0);
	
	if (tanAngleRef < 0) {
	    cosAngleRef = -cosAngleRef;
	}
	
//	return gamma*(1.0-beta*TMath::Cos(getBoostedAngle(angle,beta)));
    return gamma*(1.0-beta*cosAngleRef);
}

Double_t getShiftTan(Double_t angle, Double_t beta) {
    Double_t gamma = 1/TMath::Sqrt(1-beta*beta);
	Double_t tanAngle = TMath::Tan(angle);
	Double_t cosAngle = 1.0/sqrt(1.0+tanAngle*tanAngle);
    Double_t tanAngleRef = tanAngle*cosAngle / (gamma*(cosAngle-beta));
	Double_t cosAngleRef = 1.0/sqrt(tanAngleRef*tanAngleRef+1.0);
	
	if (tanAngleRef < 0) {
	    cosAngleRef = -cosAngleRef;
	}
	
//	return gamma*(1.0-beta*TMath::Cos(getBoostedAngle(angle,beta)));
    return gamma*(1.0-beta*cosAngleRef);
}

Double_t rad(Double_t deg) {
    return TMath::Pi()*deg/180.0;
}

Double_t deg(Double_t rad) {
    return 180.0*rad/TMath::Pi();
}

Int_t doppler() {
    Double_t beta = 0.97;
    Double_t gamma = 1/TMath::Sqrt(1-beta*beta);

    Int_t n=100;
    Double_t * x = new Double_t[n];
    Double_t * y = new Double_t[n];

    Double_t angle = rad(0.0);
    Double_t angle_max = rad(90.0);
    Double_t dangle = (angle_max-angle)/(n-1);
    
    for (Int_t i=0; i < n; i++) {
        x[i] = deg(angle);
        y[i] = deg(getBoostedAngle(angle, beta));
        angle += dangle;
    }

    TCanvas * cv = new TCanvas("cv", "boosted Angle");
    TGraph * gf = new TGraph(n,x,y);
    gf->SetTitle("Angle inside the Reference Frame");
    gf->GetXaxis()->SetTitle("Angle #Theta' inside the Observer Frame");
    gf->GetYaxis()->SetTitle("Angle #Theta inside the Reference Frame");
    gf->SetLineWidth(2);
    gf->Draw("AL");

    angle = rad(0.0);
    for (Int_t i=0; i < n; i++) {
        x[i] = deg(angle);
        y[i] = getShiftTan(angle,beta);
        angle += dangle;
    }

    TCanvas * cv2 = new TCanvas("cv2", "Wavelength Boost (Scale Factor)");
    TGraph * gf2 = new TGraph(n,x,y);
    gf2->SetTitle("Wavelength Boost (Scale Factor)");
    gf2->GetXaxis()->SetTitle("Angle #Theta' inside the Observer Frame");
    gf2->SetLineWidth(2);
    gf2->Draw("AL");

    delete[] y;
    delete[] x;

    angle = rad(50.0);
    cout << "beta=" << beta << ", gamma=" << gamma << endl;
    cout << "backboosted: " << deg(getBoostedAngle(getBoostedAngle(angle, beta), -beta)) << endl;
    Double_t scale = gamma*(1.0-beta*TMath::Cos(angle));
    Double_t backscale = gamma*(1.0+beta*TMath::Cos(getBoostedAngle(angle, beta)));
    cout << "backscale: " << scale*backscale << endl;
		
    return 0;
}

