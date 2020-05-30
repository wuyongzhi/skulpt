/**
 * @namespace Sk.abstr
 *
 */
Sk.abstr = {};

//
// Number
//

Sk.abstr.typeName = function (obj) {
    if (obj != null && obj.tp$name !== undefined) {
        return obj.tp$name;
    } else {
        return "<invalid type>";
    }
};

Sk.abstr.binop_type_error = function (v, w, name) {
    const vtypename = Sk.abstr.typeName(v);
    const wtypename = Sk.abstr.typeName(w);

    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + name + ": '" + vtypename + "' and '" + wtypename + "'");
};

Sk.abstr.unop_type_error = function (v, name) {
    var vtypename = Sk.abstr.typeName(v),
        uop = {
            "UAdd": "+",
            "USub": "-",
            "Invert": "~"
        }[name];

    throw new Sk.builtin.TypeError("bad operand type for unary " + uop + ": '" + vtypename + "'");
};

/**
 * lookup and return the LHS object slot function method.  This coudl be either a builtin slot function or a dunder method defined by the user.
 * @param obj
 * @param name
 * @returns {Object|null|undefined}
 * @private
 */
Sk.abstr.boNameToSlotFuncLhs_ = function (obj, name) {
    if (obj === null) {
        return undefined;
    }

    switch (name) {
        case "Add":
            return obj.nb$add;
        case "Sub":
            return obj.nb$subtract ;
        case "Mult":
            return obj.nb$multiply ;
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.tp$matmul ;
            }
        case "Div":
            return obj.nb$divide ;
        case "FloorDiv":
            return obj.nb$floor_divide ;
        case "Mod":
            return obj.nb$remainder ;
        case "DivMod":
            return obj.nb$divmod ;
        case "Pow":
            return obj.nb$power ;
        case "LShift":
            return obj.nb$lshift ;
        case "RShift":
            return obj.nb$rshift ;
        case "BitAnd":
            return obj.nb$and ;
        case "BitXor":
            return obj.nb$xor ;
        case "BitOr":
            return obj.nb$or ;
    }
};

Sk.abstr.boNameToSlotFuncRhs_ = function (obj, name) {
    if (obj === null) {
        return undefined;
    }

    switch (name) {
        case "Add":
            return obj.nb$reflected_add ;
        case "Sub":
            return obj.nb$reflected_subtract ;
        case "Mult":
            return obj.nb$reflected_multiply ;
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.tp$reflected_matmul ;
            }
        case "Div":
            return obj.nb$reflected_divide ;
        case "FloorDiv":
            return obj.nb$reflected_floor_divide ;
        case "Mod":
            return obj.nb$reflected_remainder ;
        case "DivMod":
            return obj.nb$reflected_divmod ;
        case "Pow":
            return obj.nb$reflected_power ;
        case "LShift":
            return obj.nb$reflected_lshift ;
        case "RShift":
            return obj.nb$reflected_rshift ;
        case "BitAnd":
            return obj.nb$reflected_and ;
        case "BitXor":
            return obj.nb$reflected_xor ;
        case "BitOr":
            return obj.nb$reflected_or ;
    }
};

Sk.abstr.iboNameToSlotFunc_ = function (obj, name) {
    switch (name) {
        case "Add":
            return obj.nb$inplace_add || obj.nb$add;
        case "Sub":
            return obj.nb$inplace_subtract || obj.nb$subtract;
        case "Mult":
            return obj.nb$inplace_multiply || obj.nb$multiply;
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.tp$inplace_matmul ;
            }
        case "Div":
            return obj.nb$inplace_divide || obj.nb$divide;
        case "FloorDiv":
            return obj.nb$inplace_floor_divide || obj.nb$floor_divide;
        case "Mod":
            return obj.nb$inplace_remainder || obj.nb$remainder;
        case "Pow":
            return obj.nb$inplace_power || obj.nb$power;
        case "LShift":
            return obj.nb$inplace_lshift || obj.nb$lshift;
        case "RShift":
            return obj.nb$inplace_rshift || obj.nb$rshift;
        case "BitAnd":
            return obj.nb$inplace_and || obj.nb$and;
        case "BitOr":
            return obj.nb$inplace_or || obj.nb$or;
        case "BitXor":
            return obj.nb$inplace_xor || obj.nb$xor;
    }
};
Sk.abstr.uoNameToSlotFunc_ = function (obj, name) {
    if (obj === null) {
        return undefined;
    }
    switch (name) {
        case "USub":
            return obj.nb$negative ;
        case "UAdd":
            return obj.nb$positive ;
        case "Invert":
            return obj.nb$invert ;
    }
};

Sk.abstr.binary_op_ = function (v, w, opname) {
    var wop;
    var ret;
    var vop;

    // All Python inheritance is now enforced with Javascript inheritance
    // (see Sk.abstr.setUpInheritance). This checks if w's type is a strict
    // subclass of v's type
    var w_is_subclass = w.constructor.prototype instanceof v.constructor;

    // From the Python 2.7 docs:
    //
    // "If the right operand’s type is a subclass of the left operand’s type and
    // that subclass provides the reflected method for the operation, this
    // method will be called before the left operand’s non-reflected method.
    // This behavior allows subclasses to override their ancestors’ operations."
    //
    // -- https://docs.python.org/2/reference/datamodel.html#index-92

    if (w_is_subclass) {
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            ret = wop.call(w, v);
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }

    vop = Sk.abstr.boNameToSlotFuncLhs_(v, opname);
    if (vop !== undefined) {
        ret = vop.call(v, w);
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // Don't retry RHS if failed above
    if (!w_is_subclass) {
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            ret = wop.call(w, v);
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }
    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function (v, w, opname) {
    var wop;
    var ret;
    var vop = Sk.abstr.iboNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        ret = vop.call(v, w);
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // If there wasn't an in-place operation, fall back to the binop
    return Sk.abstr.binary_op_(v, w, opname);
};
Sk.abstr.unary_op_ = function (v, opname) {
    var ret;
    var vop = Sk.abstr.uoNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsimArray(vop, [v]); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined) {
            return ret;
        }
    }
    Sk.abstr.unop_type_error(v, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstr.numOpAndPromote = function (a, b, opfn) {
    var tmp;
    var ans;
    if (a === null || b === null) {
        return undefined;
    }

    if (typeof a === "number" && typeof b === "number") {
        ans = opfn(a, b);
        // todo; handle float   Removed RNL (bugs in lng, and it should be a question of precision, not magnitude -- this was just wrong)
        if ((ans > Sk.builtin.int_.threshold$ || ans < -Sk.builtin.int_.threshold$) && Math.floor(ans) === ans) {
            return [Sk.builtin.lng.fromInt$(a), Sk.builtin.lng.fromInt$(b)];
        } else {
            return ans;
        }
    } else if (a === undefined || b === undefined) {
        throw new Sk.builtin.NameError("Undefined variable in expression");
    }

    if (a.constructor === Sk.builtin.lng) {
        return [a, b];
    } else if ((a.constructor === Sk.builtin.int_ ||
        a.constructor === Sk.builtin.float_) &&
        b.constructor === Sk.builtin.complex) {
        // special case of upconverting nmber and complex
        // can we use here the Sk.builtin.checkComplex() method?
        tmp = new Sk.builtin.complex(a.v);
        return [tmp, b];
    } else if (a.constructor === Sk.builtin.int_ ||
        a.constructor === Sk.builtin.float_) {
        return [a, b];
    } else if (typeof a === "number") {
        tmp = Sk.builtin.assk$(a);
        return [tmp, b];
    } else {
        return undefined;
    }
};

Sk.abstr.boNumPromote_ = {
    "Add": function (a, b) {
        return a + b;
    },
    "Sub": function (a, b) {
        return a - b;
    },
    "Mult": function (a, b) {
        return a * b;
    },
    "Mod": function (a, b) {
        var m;
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        }
        m = a % b;
        return ((m * b) < 0 ? (m + b) : m);
    },
    "Div": function (a, b) {
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        } else {
            return a / b;
        }
    },
    "FloorDiv": function (a, b) {
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        } else {
            return Math.floor(a / b);
        } // todo; wrong? neg?
    },
    "Pow": Math.pow,
    "BitAnd": function (a, b) {
        var m = a & b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitOr": function (a, b) {
        var m = a | b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitXor": function (a, b) {
        var m = a ^ b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "LShift": function (a, b) {
        var m;
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        m = a << b;
        if (m > a) {
            return m;
        } else {
            // Fail, this will get recomputed with longs
            return a * Math.pow(2, b);
        }
    },
    "RShift": function (a, b) {
        var m;
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        m = a >> b;
        if ((a > 0) && (m < 0)) {
            // fix incorrect sign extension
            m = m & (Math.pow(2, 32 - b) - 1);
        }
        return m;
    }
};

Sk.abstr.numberBinOp = function (v, w, op) {
    var tmp;
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number") {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.int_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.float_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng) {
            return tmp;
        } else if (tmp !== undefined) {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_op_(v, w, op);
};
Sk.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

Sk.abstr.numberInplaceBinOp = function (v, w, op) {
    var tmp;
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number") {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.int_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.float_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng) {
            return tmp;
        } else if (tmp !== undefined) {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_iop_(v, w, op);
};
Sk.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

Sk.abstr.numberUnaryOp = function (v, op) {
    var value;
    if (op === "Not") {
        return Sk.misceval.isTrue(v) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
    } else if (v instanceof Sk.builtin.bool) {
        value = Sk.builtin.asnum$(v);
        if (op === "USub") {
            return new Sk.builtin.int_(-value);
        }
        if (op === "UAdd") {
            return new Sk.builtin.int_(value);
        }
        if (op === "Invert") {
            return new Sk.builtin.int_(~value);
        }
    } else {
        if (op === "USub" && v.nb$negative) {
            return v.nb$negative();
        }
        if (op === "UAdd" && v.nb$positive) {
            return v.nb$positive();
        }
        if (op === "Invert" && v.nb$invert) {
            return v.nb$invert();
        }
    }

    return Sk.abstr.unary_op_(v, op);
};
Sk.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

//
// Sequence
//

Sk.abstr.fixSeqIndex_ = function (seq, i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 && seq.sq$length) {
        i += seq.sq$length();
    }
    return i;
};

/**
 * @param {*} seq
 * @param {*} ob
 * @param {boolean=} canSuspend
 */
Sk.abstr.sequenceContains = function (seq, ob, canSuspend) {
    var seqtypename;
    var special;
    var r;

    if (seq.sq$contains) {
        return seq.sq$contains(ob);
    }

    /**
     *  Look for special method and call it, we have to distinguish between built-ins and
     *  python objects
     */
    special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$contains);
    if (special !== undefined) {
        // method on builtin, provide this arg
        return Sk.misceval.isTrue(Sk.misceval.callsimArray(special, [seq, ob]));
    }

    if (!Sk.builtin.checkIterable(seq)) {
        seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
    }

    r = Sk.misceval.iterFor(Sk.abstr.iter(seq), function (i) {
        if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
            return new Sk.misceval.Break(true);
        } else {
            return false;
        }
    }, false);

    return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
};

Sk.abstr.sequenceConcat = function (seq1, seq2) {
    var seq1typename;
    if (seq1.sq$concat) {
        return seq1.sq$concat(seq2);
    }
    seq1typename = Sk.abstr.typeName(seq1);
    throw new Sk.builtin.TypeError("'" + seq1typename + "' object can't be concatenated");
};

Sk.abstr.sequenceGetIndexOf = function (seq, ob) {
    var seqtypename;
    var i, it;
    var index;
    if (seq.index) {
        return Sk.misceval.callsimArray(seq.index, [seq, ob]);
    }
    if (Sk.builtin.checkIterable(seq)) {
        index = 0;
        for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
            i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                return new Sk.builtin.int_(index);
            }
            index += 1;
        }
        throw new Sk.builtin.ValueError("sequence.index(x): x not in sequence");
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
};

Sk.abstr.sequenceGetCountOf = function (seq, ob) {
    var seqtypename;
    var i, it;
    var count;
    if (seq.count) {
        return Sk.misceval.callsimArray(seq.count, [seq, ob]);
    }
    if (Sk.builtin.checkIterable(seq)) {
        count = 0;
        for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
            i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                count += 1;
            }
        }
        return new Sk.builtin.int_(count);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
};

Sk.abstr.sequenceGetItem = function (seq, i, canSuspend) {
    var seqtypename;
    if (seq.mp$subscript) {
        return seq.mp$subscript(i);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsubscriptable");
};

Sk.abstr.sequenceSetItem = function (seq, i, x, canSuspend) {
    var seqtypename;
    if (seq.mp$ass_subscript) {
        return seq.mp$ass_subscript(i, x);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item assignment");
};

Sk.abstr.sequenceDelItem = function (seq, i) {
    var seqtypename;
    if (seq.sq$del_item) {
        i = Sk.abstr.fixSeqIndex_(seq, i);
        seq.sq$del_item(i);
        return;
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item deletion");
};

Sk.abstr.sequenceRepeat = function (f, seq, n) {
    var ntypename;
    var count;
    n = Sk.builtin.asnum$(n);
    count = Sk.misceval.asIndex(n);
    if (count === undefined) {
        ntypename = Sk.abstr.typeName(n);
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + ntypename + "'");
    }
    return f.call(seq, n);
};

Sk.abstr.sequenceGetSlice = function (seq, i1, i2) {
    var seqtypename;
    if (seq.sq$slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$slice(i1, i2);
    } else if (seq.mp$subscript) {
        return seq.mp$subscript(new Sk.builtin.slice(i1, i2));
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsliceable");
};

Sk.abstr.sequenceDelSlice = function (seq, i1, i2) {
    var seqtypename;
    if (seq.sq$del_slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$del_slice(i1, i2);
        return;
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' doesn't support slice deletion");
};

Sk.abstr.sequenceSetSlice = function (seq, i1, i2, x) {
    var seqtypename;
    if (seq.sq$ass_slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$ass_slice(i1, i2, x);
    } else if (seq.mp$ass_subscript) {
        seq.mp$ass_subscript(new Sk.builtin.slice(i1, i2), x);
    } else {
        seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("'" + seqtypename + "' object doesn't support slice assignment");
    }
};

// seq - Python object to unpack
// n   - JavaScript number of items to unpack
Sk.abstr.sequenceUnpack = function (seq, n) {
    var res = [];
    var it, i;

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
        (i !== undefined) && (res.length < n);
        i = it.tp$iternext()) {
        res.push(i);
    }

    if (res.length < n) {
        throw new Sk.builtin.ValueError("need more than " + res.length + " values to unpack");
    }
    if (i !== undefined) {
        throw new Sk.builtin.ValueError("too many values to unpack");
    }

    // Return Javascript array of items
    return res;
};

// Unpack mapping into a JS array of alternating keys/values, possibly suspending
// Skulpt uses a slightly grungy format for keyword args
// into misceval.apply() and friends (alternating JS strings and Python values).
// We should probably migrate that interface to using Python strings
// at some point, but in the meantime we have this function to
// unpack keyword dictionaries into our special format
Sk.abstr.mappingUnpackIntoKeywordArray = function (jsArray, pyMapping, pyCodeObject) {
    return Sk.misceval.chain(pyMapping.tp$getattr(new Sk.builtin.str("items")), function (itemfn) {
        if (!itemfn) { throw new Sk.builtin.TypeError("Object is not a mapping"); }
        return Sk.misceval.callsimOrSuspend(itemfn);
    }, function (items) {
        return Sk.misceval.iterFor(Sk.abstr.iter(items), function (item) {
            if (!item || !item.v) { throw new Sk.builtin.TypeError("Object is not a mapping; items() does not return tuples"); }
            if (!(item.v[0] instanceof Sk.builtin.str)) {
                throw new Sk.builtin.TypeError((pyCodeObject.tp$name ? pyCodeObject.tp$name + ":" : "") + "keywords must be strings");
            }
            jsArray.push(item.v[0].v, item.v[1]);
        });
    });
};


// A helper function for simple cases (mostly internal functions) 
// When a function uses named arguments that might passed as posargs or keyword args
// this function returns a copy of the args as positional args or raises an exception if this is not possible
// similar to the code in func_code tp$call
// see property.prototype.tp$init for a use case

Sk.abstr.copyKeywordsToNamedArgs = function (func_name, varnames, args, kwargs, defaults) {
    // args is an array, kwargs is an array or undefined
    kwargs = kwargs || [];

    const nargs = args.length + kwargs.length / 2;
    if (nargs > varnames.length) {
        throw new Sk.builtin.TypeError(func_name + "() expected at most " + varnames.length + " arguments (" + nargs + " given)");
    }
    if (!kwargs.length && defaults === undefined) {
        return args;
    }
    args = [...args]; // make a shallow copy of args

    for (let i = 0; i < kwargs.length; i += 2) {
        const name = kwargs[i]; // JS string
        if (name === null) {
            continue;
        }
        const value = kwargs[i + 1]; // Python value
        const idx = varnames.indexOf(name);

        if (idx >= 0) {
            if (args[idx] !== undefined) {
                throw new Sk.builtin.TypeError(func_name + "() got multiple values for argument '" + name + "'");
            }
            args[idx] = value;
        } else {
            throw new Sk.builtin.TypeError(func_name + "() got an unexpected keyword argument '" + name + "'");
        }
    }
    if (defaults) {
        const nargs = varnames.length;
        for (let i = nargs - 1; i >= 0; i--) {
            if (args[i] === undefined) {
                args[i] = defaults[defaults.length - 1 - (nargs - 1 - i)];
            }
        }
        const num_missing = args.filter(x => x === undefined).length;
        if (num_missing) {
            throw new Sk.builtin.TypeError(func_name + "() missing " + num_missing + " positional arguments");
        }
    }

    return args;
};

Sk.exportSymbol("Sk.abstr.copyKeywordsToNamedArgs", Sk.abstr.copyKeywordsToNamedArgs);

Sk.abstr.checkNoKwargs = function (func_name, kwargs) {
    if (kwargs && kwargs.length) {
        throw new Sk.builting.TypeError(func_name + "() takes no keyword arguments");
    }
};
Sk.exportSymbol("Sk.abstr.checkNoKwargs", Sk.abstr.checkNoKwargs);

Sk.abstr.checkNoArgs = function (func_name, args, kwargs) {
    const nargs = args.length + (kwargs ? kwargs.length : 0);
    if (nargs) {
        throw new Sk.builtin.TypeError(func_name + "() takes no arguments (" + nargs + " given)");
    }
};
Sk.exportSymbol("Sk.abstr.checkNoArgs", Sk.abstr.checkNoArgs);


Sk.abstr.checkOneArg = function (func_name, args, kwargs) {
    Sk.abstr.checkNoKwargs(func_name, kwargs);
    if (args.length !== 1) {
        throw new Sk.builtin.TypeError(func_name + "() takes exactly one argument (" + args.length + " given)");
    }
};
Sk.exportSymbol("Sk.abstr.checkOneArg", Sk.abstr.checkOneArg);


Sk.abstr.checkArgsLen = function (func_name, args, minargs, maxargs) {
    const nargs = args.length;
    let msg;
    if (maxargs === undefined) {
        maxargs = Infinity;
    }
    if ((nargs < minargs) || (nargs > maxargs)) {
        if (minargs === maxargs) {
            msg = func_name + "() takes exactly " + minargs + " arguments";
        } else if (nargs < minargs) {
            msg = func_name + "() takes at least " + minargs + " arguments";
        } else {
            msg = func_name + "() takes at most " + maxargs + " arguments";
        }
        msg += " (" + nargs + " given)";
        throw new Sk.builtin.TypeError(msg);
    }
};
Sk.exportSymbol("Sk.abstr.checkArgsLen", Sk.abstr.checkArgsLen);


//
// Object
//

Sk.abstr.objectFormat = function (obj, format_spec) {
    var meth; // PyObject
    var result; // PyObject

    // Find the (unbound!) __format__ method (a borrowed reference)
    meth = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$format);
    if (meth === undefined) {
        return Sk.misceval.callsimArray(Sk.builtin.object.prototype["__format__"], [obj, format_spec]);
    }

    // And call it
    result = Sk.misceval.callsimArray(meth, [obj, format_spec]);
    if (!Sk.builtin.checkString(result)) {
        throw new Sk.builtin.TypeError("__format__ must return a str, not " + Sk.abstr.typeName(result));
    }

    return result;
};

Sk.abstr.objectAdd = function (a, b) {
    var btypename;
    var atypename;
    if (a.nb$add) {
        return a.nb$add(b);
    }

    atypename = Sk.abstr.typeName(a);
    btypename = Sk.abstr.typeName(b);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" + atypename + "' and '" + btypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectNegative = function (obj) {
    var objtypename;
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$negative();
    }

    objtypename = Sk.abstr.typeName(obj);
    throw new Sk.builtin.TypeError("bad operand type for unary -: '" + objtypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectPositive = function (obj) {
    var objtypename = Sk.abstr.typeName(obj);
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$positive();
    }

    throw new Sk.builtin.TypeError("bad operand type for unary +: '" + objtypename + "'");
};

Sk.abstr.objectDelItem = function (o, key) {
    var otypename;
    var keytypename;
    var keyValue;
    if (o !== null) {
        if (o.mp$del_subscript) {
            o.mp$del_subscript(key);
            return;
        }
        if (o.sq$ass_item) {
            keyValue = Sk.misceval.asIndex(key);
            if (keyValue === undefined) {
                keytypename = Sk.abstr.typeName(key);
                throw new Sk.builtin.TypeError("sequence index must be integer, not '" + keytypename + "'");
            }
            Sk.abstr.sequenceDelItem(o, keyValue);
            return;
        }
        // if o is a slice do something else...
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' object does not support item deletion");
};
Sk.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

Sk.abstr.objectGetItem = function (o, key, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$getitem) {
            return o.tp$getitem(key, canSuspend);
        } else if (o.mp$subscript) {
            return o.mp$subscript(key, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$item) {
            return Sk.abstr.sequenceGetItem(o, Sk.misceval.asIndex(key), canSuspend);
        }
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support indexing");
};
Sk.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

Sk.abstr.objectSetItem = function (o, key, v, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$setitem) {
            return o.tp$setitem(key, v, canSuspend);
        } else if (o.mp$ass_subscript) {
            return o.mp$ass_subscript(key, v, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$ass_item) {
            return Sk.abstr.sequenceSetItem(o, Sk.misceval.asIndex(key), v, canSuspend);
        }
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support item assignment");
};
Sk.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);


Sk.abstr.gattr = function (obj, pyName, canSuspend) {
    // TODO is it even valid to pass something this shape in here?
    // Should this be an assert?
    if (obj === null || !obj.tp$getattr) {
        let objname = Sk.abstr.typeName(obj);
        let jsName = pyName.$jsstr();
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + jsName + "'");
    }

    // This function is so hot that we do our own inline suspension checks

    let ret = obj.tp$getattr(pyName, canSuspend);

    if (ret === undefined) {
        throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute '" + pyName.$jsstr() + "'");
    } else if (ret.$isSuspension) {
        return Sk.misceval.chain(ret, function (r) {
            if (r === undefined) {
                throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute '" + pyName.$jsstr() + "'");
            }
            return r;
        });
    } else {
        return ret;
    }
};
Sk.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);


Sk.abstr.sattr = function (obj, pyName, data, canSuspend) {
    var objname = Sk.abstr.typeName(obj), r, setf;
    var jsName = pyName.$jsstr();

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + jsName + "'");
    }

    if (obj.tp$setattr !== undefined) {
        return obj.tp$setattr(pyName, data, canSuspend);
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + jsName + "'");
    }
};
Sk.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);


Sk.abstr.iternext = function (it, canSuspend) {
    return it.tp$iternext(canSuspend);
};
Sk.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);


/**
 * Get the iterator for a Python object  This iterator could be one of the following.
 * This is the preferred mechanism for consistently getting the correct iterator.  You should
 * not just use tp$iter because that could lead to incorrect behavior of a user created class.
 *
 * - tp$iter
 * - A user defined `__iter__` method
 * - A user defined `__getitem__` method
 *
 * @param obj
 *
 * @throws {Sk.builtin.TypeError}
 * @returns {Object}
 */

Sk.abstr.iter = function (obj) {
    let iter;
    if (obj.sk$prototypical) {
        // this is the easy case we can just check 
        // slots for (tp$iter and then tp$iternext) or mp$subscript
        if (obj.tp$iter) {
            iter = obj.tp$iter();
            if (iter !== undefined && iter.tp$iternext) {
                return iter;
            }
        }
        if (obj.mp$subscript) {
            return new Sk.builtin.seq_iter_(obj);
        }
    } else {
        // in the case of multiple inheritance 
        // we know tp$iter will exist because it has all the slot functions
        iter = obj.tp$iter();
        if (iter !== undefined && Sk.abstr.lookupSpecial(iter, Sk.builtin.str.$next) !== undefined) {
            return iter;
        }
        if (Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$getitem)) {
            // then we have an object that supports __getitem__ so return a seq iterator
            return new Sk.builtin.seq_iter_(obj);
        }
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
};
Sk.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);

/**
 * Special method look up. 
 * can take a pyName or jsName
 * uses the ob$type.$typeLookup method
 *
 * @returns {undefined | Object} Return undefined if not found or the function
 */
Sk.abstr.lookupSpecial = function (obj, pyOrJsName) {
    return obj.ob$type.$typeLookup(pyOrJsName);
};
Sk.exportSymbol("Sk.abstr.lookupSpecial", Sk.abstr.lookupSpecial);

/**
 * Mark a class as unhashable and prevent its `__hash__` function from being called.
 * @param  {*} thisClass The class to mark as unhashable.
 * @return {undefined}
 */
Sk.abstr.markUnhashable = function (thisClass) {
    var proto = thisClass.prototype;
    proto.__hash__ = Sk.builtin.none.none$;
    proto.tp$hash = Sk.builtin.none.none$;
};

/**
 * Code taken from goog.inherits
 *
 * Newer versions of the closure library add a "base"attribute,
 * which we don't want/need.  So, this code is the remainder of
 * the goog.inherits function.
 */
Sk.abstr.inherits = function (childCtor, parentCtor) {
    /** @constructor */
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = Object.create(parentCtor.prototype);
    /** @override */
    childCtor.prototype.constructor = childCtor;
};

/**
 * Set up inheritance between two Python classes. This allows only for single
 * inheritance -- multiple inheritance is not supported by Javascript.
 * multiple inheritance is dealt with by tp$getattr implementations
 *
 * Javascript's inheritance is prototypal. This means that properties must
 * be defined on the superclass' prototype in order for subclasses to inherit
 * them.
 *
 * ```
 * Sk.superclass.myProperty                 # will NOT be inherited
 * Sk.superclass.prototype.myProperty       # will be inherited
 * ```
 *
 * In order for a class to be subclassable, it must (directly or indirectly)
 * inherit from Sk.builtin.object so that it will be properly initialized in
 * {@link Sk.doOneTimeInitialization} (in src/import.js). Further, all Python
 * builtins should inherit from Sk.builtin.object.
 *
 * @param {string} childName The Python name of the child (subclass).
 * @param {*} child     The subclass.
 * @param {*} parent    The base of child.
 * @param {*} metaclass    The metaclass - if none set use Sk.builtin.type.
 * @return {undefined}
 */
Sk.abstr.setUpInheritance = function (childName, child, parent, metaclass) {
    metaclass = metaclass || Sk.builtin.type;
    parent = parent || Sk.builtin.object;
    Object.setPrototypeOf(child, metaclass.prototype);

    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;


    // now some house keeping
    child.prototype.tp$base = parent;
    child.prototype.tp$name = childName;
    child.prototype.ob$type = child;
};


/**
 * Set up inheritance between type and object
 * type   instanceof object => true
 * object instanceof type   => true
 * type   instanceof type   => true
 * object instanceof object => true
 * 
 * type   subclassof object => type.prototype   instanceof object => true
 * object subclassof type   => object.prototype instanceof type   => false
 * 
 * this algorithm achieves the equivalent with the following prototypical chains 
 * using Object.setPrototypeOf
 * type.__proto__             = type   (type instanceof type)
 * type.__proto__.__proto__   = object (type instanceof object)
 * type.prototype.__proto__   = object (type subclassof object)
 * object.__proto__           = type   (object instanceof type)
 * object.__proto__.__proto__ = object (object instanceof object)
 * 
 * while Object.setPrototypeOf is not considered good practice
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
 * this is a particularly unique use case and creates a lot of prototypical benefits
 * all single inheritance classes (i.e. all builtins) now follow prototypical inheritance
 * similarly it makes metclasses that much easier to implement
 * Object.setPrototypeOf is also a feature built into the javascript language
 * 
 * @function
 */
Sk.abstr.setUpBaseInheritance = function () {
    Object.setPrototypeOf(Sk.builtin.type.prototype, Sk.builtin.object.prototype);
    Object.setPrototypeOf(Sk.builtin.type, Sk.builtin.type.prototype);
    Object.setPrototypeOf(Sk.builtin.object, Sk.builtin.type.prototype);

    // required so that type objects can be called!
    Sk.builtin.type.prototype.call = Function.prototype.call;
    Sk.builtin.type.prototype.apply = Function.prototype.apply;

    // some house keeping that would usually be taken careof by Sk.abstr.setUpInheritance
    Sk.builtin.type.prototype.tp$base = Sk.builtin.object;

    Sk.builtin.type.prototype.tp$name = "type";
    Sk.builtin.object.prototype.tp$name = "object";

    Sk.builtin.type.prototype.ob$type = Sk.builtin.type;
    Sk.builtin.object.prototype.ob$type = Sk.builtin.object;

    Sk.abstr.setUpBuiltinMro(Sk.builtin.type);
    Sk.abstr.setUpBuiltinMro(Sk.builtin.object);

    // flag for checking type objects
    Sk.builtin.type.prototype.sk$type = true;
    Sk.builtin.object.prototype.sk$object = true;
};

/**
 * This function is called in {@link Sk.doOneTimeInitialization}
 * builtins should inherit from Sk.builtin.object.
 *
 * @param  {Sk.builtin.type} child
 * @return {undefined}
 */

Sk.abstr.setUpBuiltinMro = function (child) {
    let parent = child.prototype.tp$base;
    const bases = parent === undefined ? [] : [parent];
    const mro = [child];
    for (let base = parent; base !== undefined; base = base.prototype.tp$base) {
        if (!base.sk$abstract) {
            mro.push(base);
        }
    }
    // internally we keep the mro and bases as array objects
    // the wrapper descripor returns the tuple of the array
    child.prototype.tp$bases = bases;
    child.prototype.tp$mro = mro;
    child.prototype.sk$prototypical = true;
};

Sk.abstr.setUpGetSets = function (klass, getsets) {
    getsets = getsets || klass.prototype.tp$getsets || {};
    for (let getset_name in getsets) {
        const gsd = getsets[getset_name];
        gsd.$name = getset_name;
        klass.prototype[getset_name] = new Sk.builtin.getset_descriptor(klass, gsd);
    }
    // we check this later in onetimeInitialization
    // it also means that you can create more getsets and then allocate them later
    klass.prototype.tp$getsets = null;
};

Sk.abstr.setUpMethods = function (klass, methods) {
    methods = methods || klass.prototype.tp$methods || {};
    for (let method_name in methods) {
        const method_def = methods[method_name];
        method_def.$name = method_name;
        klass.prototype[method_name] = new Sk.builtin.method_descriptor(
            klass,
            method_def
        );
    }
    klass.prototype.tp$methods = null;
};

Sk.abstr.setUpSlots = function (klass, slots) {
    const proto = klass.prototype;
    const op2shortcut = {
        Eq: "ob$eq",
        NotEq: "ob$ne",
        Gt: "ob$gt",
        GtE: "ob$ge",
        Lt: "ob$lt",
        LtE: "ob$le",
    };
    if (slots === undefined) {
        // make a shallow copy so that we don't accidently consider parent slots
        slots = { ...klass.prototype };
    } else {
        for (let slot_name in slots) {
            // inefficiency of looping twice vs code reuse.
            proto[slot_name] = slots[slot_name];
        }
    }

    // set up richcompare skulpt slots
    if (slots.tp$richcompare !== undefined) {
        for (let op in op2shortcut) {
            const shortcut = op2shortcut[op];
            proto[shortcut] = slots[shortcut] = slots[shortcut] || function (other) {
                return this.tp$richcompare(other, op);
            };
        }
    }

    if (slots.tp$new !== undefined) {
        // we deal with tp$new differently because it is not a slot wrapper but sk_method
        if (slots.tp$new === Sk.generic.new) {
            // this is a bit of a work around since we can't call the Sk.generic.new as a wrapper until we have created the class.
            slots.tp$new = proto.tp$new = Sk.generic.new(klass);
        }
        proto.__new__ = new Sk.builtin.sk_method(Sk.generic.newMethodDef, klass);
    }

    function wrap_func(klass, dunder_name, wrapped_func) {
        const slot_def = Sk.slots[dunder_name];
        // we do this here because in the generic.wrapperCall methods the wrapped_func 
        // the wrapped func should have a $name property and a $flags property (for minArgs)
        klass.prototype[dunder_name] = new Sk.builtin.wrapper_descriptor(
            klass,
            slot_def,
            wrapped_func
        );
    }
    function set_up_slot (slot_name, slots, klass, slot_mapping) {
        const wrapped_func = slots[slot_name];
        // some slots get multpile dunders
        const dunder_name = slot_mapping[slot_name];
        if (typeof dunder_name === "string") {
            wrap_func(klass, dunder_name, wrapped_func);
        } else {
            for (let i = 0; i < dunder_name.length; i++) {
                wrap_func(klass, dunder_name[i], wrapped_func);
            }
        }
    }

    // main slots
    const main_slots = Sk.subSlots.main_slots;
    for (let slot_name in main_slots) {
        if (slots[slot_name] !== undefined) {
            set_up_slot(slot_name, slots, klass, main_slots);
        }
    }

    // as_number_slots
    const number_slots = Sk.subSlots.number_slots;
    if (slots.tp$as_number !== undefined) {
        for (let slot_name in Sk.reflectedNumberSlots) {
            if (slots[slot_name] !== undefined) {
                const reflect_name = Sk.reflectedNumberSlots[slot_name];
                klass.prototype[reflect_name] = slots[reflect_name] = slots[slot_name];
            }
        }
        for (let slot_name in number_slots) {
            if (slots[slot_name] !== undefined) {
                set_up_slot(slot_name, slots, klass, number_slots);
            }
        }
    }

    // as_sequence_or_mapping slots
    const seqeunce_and_mapping_slots = Sk.subSlots.seqeunce_and_mapping_slots;
    if (slots.tp$as_sequence_or_mapping !== undefined) {
        for (let slot_name in Sk.sequenceAndMappingSlots) {
            if (slots[slot_name] !== undefined) {
                const equiv_slots = Sk.sequenceAndMappingSlots[slot_name];
                for (let i = 0; i < equiv_slots.length; i++) {
                    const equiv_slot = equiv_slots[i];
                    klass.prototype[equiv_slot] = slots[equiv_slot] = slots[slot_name];
                }
            }
        }
        for (let slot_name in seqeunce_and_mapping_slots) {
            if (slots[slot_name] !== undefined) {
                set_up_slot(slot_name, slots, klass, seqeunce_and_mapping_slots);
            }
        }
    }
    // a flag to check during doOneTimeInitialization
    klass.prototype.sk$slots = null;
};

/**
 * @function
 * @param {String} typename
 * @param {Object} options
 *
 *
 * @description
 * this can be called to create a typeobj
 * options include
 * {
 * base: default to Sk.builtin.object
 * meta: default to Sk.builtin.type
 *
 * slots: skulpt slot functions that will be allocated slot wrappers
 * methods: method objects {$meth: Function, $flags: callmethod, $doc: String},
 * getsets: getset objects {$get: Function, $set: Function, $doc, String},
 *
 * flags: Object allocated directly onto class like klass.sk$acceptable_as_base_class
 * proto: Object allocated onto the prototype useful for private methods
 * }
 * tp$methods, tp$getsets and tp$mro are set up at runtime if not setup here
 */

Sk.abstr.buildNativeClass = function (typename, options) {
    options = options || {};
    const typeobject = options.constructor || function () {
        this.$d = new Sk.builtin.dict();
    };
    let mod;
    if (typename.includes(".")) {
        // you should define the module like "collections.defaultdict" for static classes
        const mod_typename = typename.split(".");
        typename = mod_typename.pop();
        mod = mod_typename.join(".");
    }

    Sk.abstr.setUpInheritance(typename, typeobject, options.base, options.meta);

    // would need to change this for multiple inheritance.
    Sk.abstr.setUpBuiltinMro(typeobject);

    if (options.slots !== undefined) {
        // only setUpSlotWrappers if slots defined;
        Sk.abstr.setUpSlots(typeobject, options.slots);
    }

    Sk.abstr.setUpMethods(typeobject, options.methods || {});
    Sk.abstr.setUpGetSets(typeobject, options.getsets || {});

    if (mod !== undefined) {
        typeobject.prototype.__module__ = new Sk.builtin.str(mod);
    }
    const proto = options.proto || {};
    for (let p in proto) {
        typeobject.prototype[p] = proto[p];
    }
    const flags = options.flags || {};
    for (let f in flags) {
        typeobject[f] = flags[f];
    }

    // str might not have been created yet

    if (Sk.builtin.str !== undefined && typeobject.prototype.hasOwnProperty("tp$doc")) {
        const docstr = typeobject.prototype.tp$doc;
        if (typeof docstr === "string") {
            typeobject.prototype.__doc__ = new Sk.builtin.str(docstr);
        }
    }
    return typeobject;
};

Sk.abstr.setUpModuleMethods = function (module_name, method_defs, module) {
    for (let method_name in method_defs) {
        const method_def = method_defs[method_name];
        method_def.$name = method_def.$name || method_name;
        module[method_name] = new Sk.builtin.sk_method(method_def, undefined, module_name);
    }
};

/**
 * Call the super constructor of the provided class, with the object `self` as
 * the `this` value of that constructor. Any arguments passed to this function
 * after `self` will be passed as-is to the constructor.
 *
 * @param  {*} thisClass The subclass.
 * @param  {Object} self      The instance of the subclas.
 * @param  {...?} args Arguments to pass to the constructor.
 * @return {undefined}
 */
Sk.abstr.superConstructor = function (thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
};
