Double_t * x,y[n];
Double_t * xadd[n_add];
Double_t * nx,ny[2*n];

Int_t get_new_y_values (Int_t n, Double_t * x,  Double_t * y, Int_t n_add, Double_t * xadd, Double_t * nx, Double_t * ny) {
    Int_t i, j, k;

    j = 0;
    while ( (j < n_add) && (xadd[j] < x[0]) ) {
        nx[j] = xadd[j];
        ny[j] = 0.0;
        j++;
    }

    k = j;
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
