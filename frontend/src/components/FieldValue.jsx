import React from 'react';
import './FieldValue.css';
export const FieldValue = ({classname, fieldname, value}) => {
    return(
        <div className={`field-value ${classname || ""}`}>
            <span className="flabel">{fieldname}</span>
            <span className="fvalue">{value}</span>
        </div>
    );
};