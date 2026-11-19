package com.employee.employee_dekko_v2

import android.annotation.SuppressLint
import android.content.Context
import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.widget.Toast
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.JavascriptInterface
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private class PaySlipPdfBridge(
        private val activity: MainActivity,
        private val webView: WebView
    ) {
        @JavascriptInterface
        fun downloadPaySlipPdf() {
            activity.runOnUiThread {
                val printManager =
                    activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                val adapter = webView.createPrintDocumentAdapter("Pay Slip")
                printManager.print(
                    "Pay Slip",
                    adapter,
                    PrintAttributes.Builder().build()
                )
            }
        }
    }


    private class SignaturePngBridge(
        private val activity: MainActivity
    ) {
        @JavascriptInterface
        fun saveSignaturePng(base64Png: String): Boolean {
            var savedUri: android.net.Uri? = null
            return try {
                val bytes = Base64.decode(base64Png, Base64.DEFAULT)
                if (bytes.isEmpty()) throw IllegalArgumentException("Empty PNG")

                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, "Email_Signature.png")
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                    put(
                        MediaStore.MediaColumns.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS + "/Dekko Signatures"
                    )
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }

                savedUri = activity.contentResolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    values
                ) ?: throw IllegalStateException("Could not create PNG file")

                activity.contentResolver.openOutputStream(savedUri!!).use { stream ->
                    if (stream == null) throw IllegalStateException("Could not open PNG file")
                    stream.write(bytes)
                    stream.flush()
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val completed = ContentValues().apply {
                        put(MediaStore.MediaColumns.IS_PENDING, 0)
                    }
                    activity.contentResolver.update(savedUri!!, completed, null, null)
                }

                activity.runOnUiThread {
                    Toast.makeText(
                        activity,
                        "PNG saved in Downloads/Dekko Signatures",
                        Toast.LENGTH_LONG
                    ).show()
                }
                true
            } catch (error: Exception) {
                savedUri?.let { activity.contentResolver.delete(it, null, null) }
                activity.runOnUiThread {
                    Toast.makeText(
                        activity,
                        "PNG save failed: ${error.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
                false
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android-only: white status bar with dark system icons
        window.statusBarColor = android.graphics.Color.WHITE
        window.decorView.systemUiVisibility =
            window.decorView.systemUiVisibility or
            android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR

        val webView = WebView(this)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            allowFileAccess = true
            allowContentAccess = true
            javaScriptCanOpenWindowsAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                view?.evaluateJavascript(
                    """
                    (function() {
                        var style = document.getElementById('dekkoAndroidDepartmentSpacing');
                        if (!style) {
                            style = document.createElement('style');
                            style.id = 'dekkoAndroidDepartmentSpacing';
                            document.head.appendChild(style);
                        }
                        style.textContent = `
                            html body #organogramPage,
                            html body #holidayCalendarPage,
                            html body #allEmployeesPage,
                            html body #departmentPage,
                            html body #favoritePage,
                            html body #birthdayPage,
                            html body #detailsPage,
                            html body #loginPage,
                            html body #resetPasswordPage,
                            html body #adminPage,
                            html body #salaryPage,
                            html body #paySlipPage {
                                padding-top: 0 !important;
                                margin-top: 0 !important;
                            }
                        `;
                    })();
                    """.trimIndent(),
                    null
                )
            }
        }
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(PaySlipPdfBridge(this, webView), "AndroidPaySlipPdf")
        webView.addJavascriptInterface(SignaturePngBridge(this), "AndroidSignaturePng")
        WebView.setWebContentsDebuggingEnabled(true)

        webView.settings.userAgentString =
            webView.settings.userAgentString + " DekkoEmployeeInfoAndroid"

        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    """
                    (function() {
                        const createEmployeeMenuPage = document.getElementById('createEmployeeMenuPage');
                        if (createEmployeeMenuPage && createEmployeeMenuPage.style.display !== 'none') {
                            const back = document.getElementById('createEmployeeMenuBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        // Handle Android Back inside the E-mail Signature section.
                        const emailSignaturePage = document.getElementById('emailSignaturePage');
                        if (emailSignaturePage && emailSignaturePage.style.display !== 'none') {
                            const signatureFrameWrap = document.getElementById('emailSignatureFrameWrap');
                            if (signatureFrameWrap && signatureFrameWrap.style.display !== 'none') {
                                const backToDivisions = document.getElementById('emailSignatureBackButton');
                                if (backToDivisions) {
                                    backToDivisions.click();
                                    return true;
                                }
                            } else {
                                const backToHome = document.getElementById('emailSignatureBackButton');
                                if (backToHome) {
                                    backToHome.click();
                                    return true;
                                }
                            }
                            return true;
                        }

                        // Handle Android Back inside Head Office Layout.
                        const headOfficeLayoutPage = document.getElementById('headOfficeLayoutPage');
                        if (headOfficeLayoutPage && headOfficeLayoutPage.style.display !== 'none') {
                            const viewer = document.getElementById('headOfficeLayoutViewer');
                            const slots = document.getElementById('headOfficeLayoutSlots');

                            if (viewer && viewer.style.display !== 'none') {
                                const backToSlots = document.getElementById('headOfficeLayoutBackToSlots');
                                if (backToSlots) backToSlots.click();
                                return true;
                            }

                            if (slots && slots.style.display !== 'none') {
                                const backToFloors = document.getElementById('headOfficeLayoutBackToFloors');
                                if (backToFloors) backToFloors.click();
                                return true;
                            }

                            const backToHome = document.getElementById('headOfficeLayoutBackButton');
                            if (backToHome) backToHome.click();
                            return true;
                        }

                        const employeeFeaturePageIds = [
                            'addHeadOfficeEmployeePage',
                            'addFactoryEmployeePage',
                            'employeePhotoUploadPage',
                            'editExistingEmployeePage',
                            'employeePabxListPage'
                        ];

                        for (const pageId of employeeFeaturePageIds) {
                            const page = document.getElementById(pageId);
                            if (page && page.style.display !== 'none') {
                                const back = page.querySelector('[data-create-employee-back]') ||
                                    (pageId === 'employeePabxListPage'
                                        ? document.getElementById('employeePabxListBackButton')
                                        : null);
                                if (back) {
                                    back.click();
                                    return true;
                                }
                            }
                        }

                        if (typeof window.handleAndroidBack === 'function') {
                            return window.handleAndroidBack();
                        }

                        const organogramPage = document.getElementById('organogramPage');
                        if (organogramPage && organogramPage.style.display !== 'none') {
                            const back = document.getElementById('organogramBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        const detailsPage = document.getElementById('detailsPage');
                        const departmentPage = document.getElementById('departmentPage');
                        const listPage = document.getElementById('listPage');
                        const favoritePage = document.getElementById('favoritePage');

                        if (detailsPage && detailsPage.style.display !== 'none') {
                            const back = document.getElementById('backButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        if (departmentPage && departmentPage.style.display !== 'none') {
                            const back = document.getElementById('departmentBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        if (favoritePage && favoritePage.style.display !== 'none') {
                            const back = document.getElementById('favoriteBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        const allEmployeesPage = document.getElementById('allEmployeesPage');
                        if (allEmployeesPage && allEmployeesPage.style.display !== 'none') {
                            const back = document.getElementById('allEmployeesBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        const birthdayPage = document.getElementById('birthdayPage');
                        if (birthdayPage && birthdayPage.style.display !== 'none') {
                            const back = document.getElementById('birthdayBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        const paySlipPage = document.getElementById('paySlipPage');
                        if (paySlipPage && paySlipPage.style.display !== 'none') {
                            const back = document.getElementById('paySlipPageBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        const salaryPage = document.getElementById('salaryPage');
                        if (salaryPage && salaryPage.style.display !== 'none') {
                            const back = document.getElementById('salaryBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        const holidayCalendarPage = document.getElementById('holidayCalendarPage');
                        if (holidayCalendarPage && holidayCalendarPage.style.display !== 'none') {
                            const back = document.getElementById('holidayCalendarBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }
                        const attendancePage = document.getElementById('attendancePage');
                        if (attendancePage && attendancePage.style.display !== 'none') {
                            const back = document.getElementById('attendanceBackButton');
                            if (back) {
                                back.click();
                                return true;
                            }
                        }

                        return false;
                    })()
                    """.trimIndent()
                ) { result ->
                    if (result != "true") {
                        finish()
                    }
                }
            }
        })

        val liveUrl = String(byteArrayOf(104,116,116,112,115,58,47,47,104,97,98,105,98,50,50,50,54,54,54,46,103,105,116,104,117,98,46,105,111,47,68,101,107,107,111,95,69,109,112,108,111,121,101,101,95,73,110,102,111,95,86,50,47))
        webView.loadUrl(liveUrl)

        setContentView(webView)
    }
}
