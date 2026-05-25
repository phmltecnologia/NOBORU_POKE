/**
 * Campo de telefone — máscara e validação (Brasil: fixo, celular, +55).
 */
(function () {
  var MAX_LOCAL = 11;
  var MAX_WITH_COUNTRY = 13;

  function digitsOnly(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function stripLeadingZeros(d) {
    return d.replace(/^0+/, "");
  }

  function splitCountry(d) {
    var raw = stripLeadingZeros(digitsOnly(d));
    if (raw.indexOf("55") === 0 && raw.length > 2) {
      return { country: "55", local: raw.slice(2) };
    }
    return { country: "", local: raw };
  }

  function isMobileLocal(local) {
    return local.length >= 3 && local.charAt(2) === "9";
  }

  function formatLocal(local) {
    var d = local.slice(0, MAX_LOCAL);
    if (!d.length) return "";

    if (d.length <= 2) {
      return "(" + d;
    }

    var ddd = d.slice(0, 2);
    var rest = d.slice(2);
    var mobile = isMobileLocal(d);

    if (mobile) {
      rest = rest.slice(0, 9);
      if (rest.length <= 5) {
        return "(" + ddd + ") " + rest;
      }
      return "(" + ddd + ") " + rest.slice(0, 5) + "-" + rest.slice(5);
    }

    rest = rest.slice(0, 8);
    if (rest.length <= 4) {
      return "(" + ddd + ") " + rest;
    }
    return "(" + ddd + ") " + rest.slice(0, 4) + "-" + rest.slice(4);
  }

  function formatDisplay(value) {
    var parts = splitCountry(value);
    var localFmt = formatLocal(parts.local);
    if (!localFmt) {
      return parts.country ? "+55 " : "";
    }
    if (parts.country) {
      return "+55 " + localFmt;
    }
    return localFmt;
  }

  function normalize(value) {
    var parts = splitCountry(value);
    var local = parts.local.slice(0, MAX_LOCAL);
    if (parts.country) {
      return "55" + local;
    }
    return local;
  }

  function validate(value) {
    var d = normalize(value);
    if (!d) {
      return { ok: false, error: "Informe o telefone.", digits: "", formatted: "" };
    }

    var local;
    var withCountry = false;

    if (d.indexOf("55") === 0 && d.length > 2) {
      withCountry = true;
      local = d.slice(2);
    } else {
      local = d;
    }

    if (local.length < 10) {
      return {
        ok: false,
        error: "Telefone incompleto. Inclua o DDD e o número.",
        digits: d,
        formatted: formatDisplay(value),
      };
    }

    if (local.length === 10) {
      if (local.charAt(2) === "9") {
        return {
          ok: false,
          error: "Celular com 9 dígitos: falta um número após o DDD.",
          digits: d,
          formatted: formatDisplay(value),
        };
      }
      return { ok: true, error: "", digits: d, formatted: formatDisplay(value) };
    }

    if (local.length === 11) {
      if (local.charAt(2) !== "9") {
        return {
          ok: false,
          error: "Número com 11 dígitos deve ser celular (começar com 9 após o DDD).",
          digits: d,
          formatted: formatDisplay(value),
        };
      }
      return { ok: true, error: "", digits: d, formatted: formatDisplay(value) };
    }

    if (withCountry && (local.length === 10 || local.length === 11)) {
      return { ok: true, error: "", digits: d, formatted: formatDisplay(value) };
    }

    return {
      ok: false,
      error: "Telefone inválido. Use DDD + número ou +55 e o número completo.",
      digits: d,
      formatted: formatDisplay(value),
    };
  }

  function countDigitsBefore(str, pos) {
    var n = 0;
    for (var i = 0; i < pos && i < str.length; i++) {
      if (/\d/.test(str.charAt(i))) n++;
    }
    return n;
  }

  function cursorAfterDigitIndex(formatted, digitIndex) {
    if (digitIndex <= 0) return 0;
    var n = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        n++;
        if (n === digitIndex) return i + 1;
      }
    }
    return formatted.length;
  }

  function capDigits(raw) {
    var parts = splitCountry(raw);
    var maxLocal = MAX_LOCAL;
    if (parts.country) {
      parts.local = parts.local.slice(0, maxLocal);
      return parts.country + parts.local;
    }
    return parts.local.slice(0, maxLocal);
  }

  function applyFormat(input) {
    var start = input.selectionStart;
    var digitBefore = countDigitsBefore(input.value, start);
    var capped = capDigits(digitsOnly(input.value));
    var formatted = formatDisplay(capped);
    input.value = formatted;
    var newPos = cursorAfterDigitIndex(formatted, digitBefore);
    try {
      input.setSelectionRange(newPos, newPos);
    } catch (e) {
      /* ignore */
    }
  }

  function setFieldError(input, message) {
    var field = input.closest(".field");
    if (!field) return;
    var existing = field.querySelector(".field__phone-error");
    if (message) {
      field.classList.add("field--invalid");
      if (!existing) {
        existing = document.createElement("p");
        existing.className = "field__phone-error field__hint";
        existing.setAttribute("role", "alert");
        field.appendChild(existing);
      }
      existing.textContent = message;
    } else {
      field.classList.remove("field--invalid");
      if (existing) existing.remove();
    }
  }

  function bindInput(input) {
    if (!input || input.dataset.phoneBound === "1") return;
    input.dataset.phoneBound = "1";
    input.setAttribute("inputmode", "tel");
    input.setAttribute("autocomplete", "tel");
    input.setAttribute("maxlength", "20");

    if (!input.getAttribute("placeholder")) {
      input.setAttribute("placeholder", "(48) 99999-9999");
    }

    if (input.value) {
      input.value = formatDisplay(input.value);
    }

    input.addEventListener("input", function () {
      applyFormat(input);
      setFieldError(input, "");
    });

    input.addEventListener("blur", function () {
      var v = validate(input.value);
      if (!v.ok && digitsOnly(input.value).length > 0) {
        setFieldError(input, v.error);
      } else {
        setFieldError(input, "");
        if (v.formatted) input.value = v.formatted;
      }
    });

    input.addEventListener("paste", function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData("text") || "";
      var merged = digitsOnly(input.value.slice(0, input.selectionStart) + text + input.value.slice(input.selectionEnd));
      input.value = formatDisplay(capDigits(merged));
      setFieldError(input, "");
      try {
        input.setSelectionRange(input.value.length, input.value.length);
      } catch (err) {
        /* ignore */
      }
    });
  }

  function init(scope) {
    var root = scope && scope.querySelector ? scope : document;
    var inputs = root.querySelectorAll('input[type="tel"], input[data-phone="true"]');
    for (var i = 0; i < inputs.length; i++) {
      bindInput(inputs[i]);
    }
  }

  function getValue(input) {
    var v = validate(input && input.value);
    return v.formatted || formatDisplay(input ? input.value : "");
  }

  function isValid(value) {
    return validate(value).ok;
  }

  window.PhoneField = {
    init: init,
    format: formatDisplay,
    normalize: normalize,
    validate: validate,
    getValue: getValue,
    isValid: isValid,
    bind: bindInput,
  };
})();
