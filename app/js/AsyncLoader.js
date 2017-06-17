var AsyncLoader = (function() {
'use strict';

var cache = {};

// Load a number of files, then callback.
// [url->{responseType,bypassCache}] --> [url->{responseType,data,cached}]
function loadFiles(files, callbackComplete, callbackError) {
    var returnFiles = {};
    var filenames = (files instanceof Array) ? files : Object.keys(files);
    var numberOfFilesRemaining = filenames.length;
    var numberOfResponsesRemaining = numberOfFilesRemaining;

    function handleData(url, data) {
        returnFiles[url] = data;
        numberOfFilesRemaining--;
        numberOfResponsesRemaining--;
        if (numberOfFilesRemaining === 0) {
            callbackComplete && callbackComplete(returnFiles);
        } else if (numberOfResponsesRemaining === 0) {
            callbackError && callbackError();
        }
    };

    function handleError() {
        numberOfResponsesRemaining--;
        if (numberOfResponsesRemaining === 0) {
            callbackError && callbackError();
        }
    };

    filenames.forEach(function(url) {
        var fileOptions = (files instanceof Array) ? {} : files[url];
        if (!fileOptions.bypassCache && cache[url]) {
            handleData(url, cache[url]);
        } else {
            var xhr = new XMLHttpRequest();
            xhr.responseType = fileOptions.responseType || 'text';
            xhr.addEventListener('load', function(e) {
                if (xhr.status === 200) {
                    cache[url] = {
                        data: xhr.response,
                        responseType: xhr.responseType,
                        cached: true
                    };
                    handleData(url, {
                        data: xhr.response,
                        responseType: xhr.responseType,
                        cached: false
                    });
                } else {
                    handleError();
                }
            });
            xhr.addEventListener('error', handleError);
            xhr.addEventListener('abort', handleError);
            xhr.open('GET', url + '?t=' + Date.now());
            xhr.send();
        }
    });
};

function extractUrlBase(url) {
    var parts = url.split('/');
    if (parts.length === 1) {
        return './';
    } else {
        parts.pop();
        return parts.join('/') + '/';
    }
};

function extractFilename(url) {
    var parts = url.split('/');
    return parts.pop();
};

function extractFilenameExtension(url) {
    return extractFilename(url).split('.').pop();
};

return {
    loadFiles: loadFiles,
    extractUrlBase: extractUrlBase,
    extractFilename: extractFilename,
    extractFilenameExtension: extractFilenameExtension
};

})();
