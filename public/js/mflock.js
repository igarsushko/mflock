var util = {
    rtrim: /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
    queryParams: {},
    init: function()
    {
        this.queryParams = this.getUrlParams();
    },
    trim: function(text)
    {
        return text === null ? '' : text.replace(this.rtrim, '');
    },
    isBlank: function(str)
    {
        return typeof str === 'undefined' || str === null || str === '' || this.trim(str) === '';
    },
    rmspace: function(str)
    {
        if (str !== null && typeof str === 'string')
        {
            return str.replace(/\s/g, '');
        }

        return str;
    },
    isNumKey: function(charCode)
    {
        return charCode >= 48 && charCode <= 57;
    },
    isSpecialKey: function(charCode)
    {
        //8 - backspace
        return charCode == 8;
    },
    allowOnlyIntNumberKey: function(evt)
    {
        var charCode = util.charCode(evt);
        var isAllowed = util.isNumKey(charCode) || util.isSpecialKey(charCode);

        util.stopEvent(!isAllowed, evt);
    },
    allowOnlyFloatNumberKey: function(evt)
    {
        var charCode = util.charCode(evt);
        var num = charCode == 46 ? 1 : 0; // if dot was pressed
        if (evt.target.value.split('.').length + num > 2) //already has dot
        {
            util.stopEvent(true, evt);

            var val = evt.target.value;
            evt.target.value = val.substr(0, val.length);
            return;
        }

        var isAllowed = util.isNumKey(charCode) || charCode == 46 || util.isSpecialKey(charCode);

        util.stopEvent(!isAllowed, evt);
    },
    byId: function(id)
    {
        return document.getElementById(id);
    },
    stopEvent: function(doStop, evt)
    {
        if (doStop)
        {
            evt.returnValue = false;
            if (evt.preventDefault)
            {
                evt.preventDefault();
            }
        }
    },
    fixify: function(evt)
    {
        //1. zero like
        var val = evt.target.value;
        if (util.isBlank(val) || val.match('^[0\\.]0*\\.?0*$'))
        {
            evt.target.value = '0';
        }

        //2.

        //3. max value 
        val = evt.target.value;
        var max = $(evt.target).attr('maxvalue');
        if (parseFloat(val) > parseFloat(max))
        {
            evt.target.value = max;
        }
    },
    getSelectValue: function(selectId)
    {
        var selectEl = this.byId(selectId);
        return selectEl.options[selectEl.selectedIndex].value;
    },
    setValueFromParam: function(id, fallback, type)
    {
        var input = $('#' + id);
        if (this.isDefined(input))
        {
            var result = this.isDefined(fallback) ? fallback : '';

            var param = this.queryParams[id];
            if (!this.isBlank(param))
            {
                if (this.isDefined(type))
                {
                    try
                    {
                        if ('int' === type)
                        {
                            result = parseInt(param);
                            if (isNaN(result))
                            {
                                result = '0';
                            }
                        }
                        else if ('float' === type)
                        {
                            result = parseFloat(param);
                            if (isNaN(result))
                            {
                                result = '0';
                            }
                        }
                    }
                    catch (e)
                    {

                        }
                }
                else
                {
                    result = param;
                }
            }

            input.val(result);
        }
    },
    getUrlParams: function()
    {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    format: function()
    {
        var args = arguments; //not array
        var str = this.shift(args);
        return str.replace(/{(\d+)}/g, function(match, number)
        {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    },
    //remove and get 1st, don't have to be array
    shift: function(arr)
    {
        var len = arr.length;
        var first = null;
        if (len > 0)
        {
            first = arr[0];
            for (var i = 1; i < len; i++)
            {
                arr[i - 1] = arr[i];
            }
            arr[len - 1] = null;
        }
        return first;
    },
    th: function(name, style)
    {
        if (this.isDefined(style))
        {
            return '<th scope="col" style="' + style + '" >' + name + '</th>';
        }
        else
        {
            return '<th scope="col">' + name + '</th>';
        }
    },
    td: function(val)
    {
        return '<td>' + val + '</td>';
    },
    isDefined: function(obj)
    {
        return typeof obj !== 'undefined' && obj !== null;
    },
    charCode: function(evt)
    {
        return evt.which ? evt.which : event.keyCode;
    },
    //forbiddenKeys like ['v']
    disableCtrlKeyCombination: function(e, forbiddenKeys)
    {
        var key;
        var isCtrl;
        if (window.event)
        {
            key = window.event.keyCode; //IE
            isCtrl = window.event.ctrlKey;
        }
        else
        {
            key = e.which; //modern browsers
            isCtrl = e.ctrlKey;
        }

        if (isCtrl)
        {
            for (var i = 0; i < forbiddenKeys.length; i++)
            {
                if (forbiddenKeys[i] == String.fromCharCode(key).toLowerCase())
                {
                    return false;
                }
            }
        }
        return true;
    },
    changeBrowserUrl: function(newUrl)
    {
        if (window.history && window.history.replaceState)
        {
            window.history.replaceState(null, null, newUrl);
        }
    },
    spacify: function(s)
    {
        s = util.rmspace(s);

        if (s.split('.').length > 2) //format only with 1 dot max
        {
            return s;
        }

        var postfix = '';
        var dotIdx = s.indexOf('.');
        if (dotIdx != -1)
        {
            postfix = s.substr(dotIdx, slen);
            s = s.substr(0, dotIdx);
        }

        var slen = s.length;
        if (slen > 3)
        {
            var j = 0;
            for (var i = slen - 1; i > 0; i--)
            {
                j++;

                if (j == 3)
                {
                    var strstart = s.substr(0, i);
                    var strend = s.substr(i, slen + 1);

                    s = strstart + ' ' + strend;
                    j = 0;
                }
            }
        }

        return s + postfix;
    },
    ajax: {
        createXHR: function()
        {
            var xhr;
            if (window.ActiveXObject)
            {
                try
                {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (e)
                {
                    xhr = null;
                }
            }
            else
            {
                xhr = new XMLHttpRequest();
            }

            return xhr;
        },
        get: function(url, success, always, error)
        {
            var xhr = this.createXHR();
            xhr.onreadystatechange = function()
            {
                if (xhr.readyState === 4)
                {
                    var status = xhr.status; // like 200
                    var statusText = xhr.statusText; //like OK

                    var response = eval('(' + xhr.responseText + ')');
                    if (status == '200')
                    {
                        if (util.isDefined(success))
                        {
                            success(response);
                        }
                    }
                    else
                    {
                        if (util.isDefined(error))
                        {
                            error(status, statusText, response);
                        }
                        else
                        {
                            util.ajax.defaultErrorHander(status, statusText, response)
                        }
                    }

                    if (util.isDefined(always))
                    {
                        always();
                    }
                }
            }

            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', '*/*');
            xhr.send();
        },
        defaultErrorHander: function(status, statusText, response)
        {
            var mes = '';
            if (util.isDefined(response.code) && util.isDefined(response.message))
            {
                var c = response.code;
                if (c == 'InternalError' || c == 'TooManyRequestsError' || c == 'InvalidArgument')
                {
                    mes += ' ' + response.message;
                }
                else
                {
                    mes += 'Unexpected server error. Please try again later';
                }
            }

            if (!util.isBlank(mes))
            {
                $('#errormessage').text(mes);
            }
        }
    }
}