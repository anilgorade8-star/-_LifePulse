package com.lifepulse.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // This line is for the edge-to-edge layout, it is correct.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

    // The incorrect WebChromeClient has been removed to restore permission handling.
  }
}
