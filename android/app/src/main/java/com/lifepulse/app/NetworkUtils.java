package com.lifepulse.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

import java.util.function.Consumer;

/**
 * Utility class for monitoring network connectivity.
 */
public class NetworkUtils {

    private final ConnectivityManager connectivityManager;
    private final Consumer<Boolean> onNetworkStatusChanged;

    /**
     * Constructor.
     *
     * @param context                The application context.
     * @param onNetworkStatusChanged A consumer that will receive network status updates.
     */
    public NetworkUtils(Context context, Consumer<Boolean> onNetworkStatusChanged) {
        this.connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        this.onNetworkStatusChanged = onNetworkStatusChanged;
    }

    /**
     * Registers a callback to listen for network changes.
     */
    public void registerNetworkCallback() {
        NetworkRequest networkRequest = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build();

        connectivityManager.registerNetworkCallback(networkRequest, new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                // Network is available
                super.onAvailable(network);
                onNetworkStatusChanged.accept(true);
            }

            @Override
            public void onLost(@NonNull Network network) {
                // Network is lost
                super.onLost(network);
                onNetworkStatusChanged.accept(false);
            }

            @Override
            public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities networkCapabilities) {
                // This can be used to check for more specific network properties, like if it's unmetered.
                super.onCapabilitiesChanged(network, networkCapabilities);
                boolean isOnline = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
                onNetworkStatusChanged.accept(isOnline);
            }
        });
    }

    /**
     * Gets the current network status.
     *
     * @return True if the device is connected to the internet, false otherwise.
     */
    public boolean isOnline() {
        Network activeNetwork = connectivityManager.getActiveNetwork();
        if (activeNetwork == null) {
            return false;
        }
        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(activeNetwork);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }
}
