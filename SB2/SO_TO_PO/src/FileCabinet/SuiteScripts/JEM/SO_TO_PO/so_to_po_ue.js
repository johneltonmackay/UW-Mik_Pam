/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/email'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     */
    (record, runtime, search, format, email) => {
        
        let arrErrorMessage = []

        const afterSubmit = (scriptContext) => {
            log.debug('scriptContext', scriptContext.type)
            if (scriptContext.type =='edit' || scriptContext.type == 'xedit' || scriptContext.type == 'create') {
                let currentUser = runtime.getCurrentUser();
                log.debug('Current User ID', currentUser.id);
                const objCurrentRecord = scriptContext.newRecord;
                const IRWINDALE_00_IN_HOUSE = 3 
                const OE_MISC_ITEM = 13173
                const OE_MISC_CHARGE = 13374
                const UNIDENTIFIED_SHIPPING_METHOD = 13375
                const SET_UP = 2677
                
                const intRecordId = objCurrentRecord.id;
                const strRecordType = objCurrentRecord.type;
                let objCustomerParam = {}
                let objSOData = {}
                let objShipToData = {}
                objSOData.customerId = null
                objSOData.shipMethodId = null
                objSOData.otherRef = null
                objSOData.orderDate = null
                objSOData.inHandsDate = null
                objSOData.memo = null
                let arrMemo = []
                let arrItemData = []
                let intSalesOrderId = null
                let strPoNumber = null
                let strJsonData = null

                if (intRecordId) {
                    let objRecord = record.load({
                        type: strRecordType,
                        id: intRecordId,
                        isDynamic: true
                    });

                    if (objRecord) {
                        strJsonData = objRecord.getValue({
                            fieldId: 'custrecord_json_data'
                        });

                        strPoNumber = objRecord.getValue({
                            fieldId: 'custrecord_po_number'
                        });
                        
                        if (strJsonData) {
                            let objData = JSON.parse(strJsonData);
                            let arrItemSearch = searchItem()
                            let arrShipMethodSearch = searchShipMethod()
                            try {
                                for (const key in objData) {
                                    if(key == 'purchaseOrder'){
                                        let objPOData = objData[key]
                                        let strCompanyName = objPOData.customer.company
                                        let strCustomerFname = objPOData.customer.firstName
                                        let strCustomerLname = objPOData.customer.lastName
                                        let strCustomerEmail = objPOData.customer.email

                                        let strCustomerAddr1 = objPOData.customer.address1
                                        let strCustomerAddr2 = objPOData.customer.address2
                                        let strCustomerCity = objPOData.customer.city
                                        let strCustomerState = objPOData.customer.state
                                        let strCustomerCountry = objPOData.customer.country
                                        let strCustomerZipCode = objPOData.customer.zipCode
                                        let strCustomerPhone = objPOData.customer.phone

                                        let strCustomerPpaiNumber = objPOData.ppaiNumber
                                        let strCustomerASINumber = objPOData.asiNumber

                                        let strShipToName = objPOData.shipTo.name;
                                        let strShipToCompany = objPOData.shipTo.company;
                                        let strShipToAddress1 = objPOData.shipTo.address1;
                                        let strShipToAddress2 = objPOData.shipTo.address2;
                                        let strShipToCity = objPOData.shipTo.city;
                                        let strShipToState = objPOData.shipTo.state;
                                        let strShipToZipCode = objPOData.shipTo.zipCode;
                                        let strShipToCountry = objPOData.shipTo.country;
                                        

                                        objShipToData = {
                                            name: strShipToName,
                                            company: strShipToCompany,
                                            address1: strShipToAddress1,
                                            address2: strShipToAddress2,
                                            city: strShipToCity,
                                            state: strShipToState,
                                            zipCode: strShipToZipCode,
                                            country: strShipToCountry
                                        }

                                        objSOData.otherRef = objPOData.purchaseOrderNumber
                                        let rawOrderDate = objPOData.orderDate ? new Date(objPOData.orderDate) : new Date()
                                        let rawInHandsDate = objPOData.inHandsDate ? new Date(objPOData.inHandsDate) : null

                                        if (rawOrderDate){
                                            objSOData.orderDate = format.format({
                                                value: rawOrderDate,
                                                type: format.Type.DATE
                                            });
                                        }

                                        if (rawInHandsDate){
                                            objSOData.inHandsDate = format.format({
                                                value: rawInHandsDate,
                                                type: format.Type.DATE
                                            });
                                        }

                                        let strShipMethod = objPOData.shippingMethod

                                        if (strShipMethod){
                                            const arrFilteredByShipMethod = arrShipMethodSearch.filter(item =>
                                                item.itemid.toLowerCase().includes(strShipMethod.toLowerCase())
                                            );
                                            log.debug('arrFilteredByShipMethod', arrFilteredByShipMethod)
    
                                            if (arrFilteredByShipMethod.length == 1){
                                                objSOData.shipMethodId = arrFilteredByShipMethod[0].internalId
                                                objSOData.shipMethodName = arrFilteredByShipMethod[0].displayname
                                            } else {
                                                objSOData.shipMethodId = UNIDENTIFIED_SHIPPING_METHOD
                                                objSOData.shipMethodName = strShipMethod
                                            }   
                                        } else {
                                            objSOData.shipMethodId = UNIDENTIFIED_SHIPPING_METHOD
                                            objSOData.shipMethodName = strShipMethod
                                        }

                                        if (strCustomerEmail){
                                            let arrCustomer = searchCustomer(strCustomerEmail)
                                            if(arrCustomer.length > 0 && arrCustomer){
                                                objSOData.customerId = arrCustomer[0].internalId
                                            } else {
                                                objCustomerParam = {
                                                    companyName: strCompanyName,
                                                    email: strCustomerEmail,
                                                    firstName: strCustomerFname,
                                                    lastName: strCustomerLname,
                                                    phone: strCustomerPhone,
                                                    ppaiNumber: strCustomerPpaiNumber,
                                                    asiNumber: strCustomerASINumber,
                                                    address1: strCustomerAddr1,
                                                    address2: strCustomerAddr2,
                                                    city: strCustomerCity,
                                                    state: strCustomerState,
                                                    zipCode: strCustomerZipCode,
                                                    country: strCustomerCountry,
                                                }
                                            }
                                        } else {
                                            objCustomerParam = {
                                                companyName: strCompanyName,
                                                email: strCustomerEmail,
                                                firstName: strCustomerFname,
                                                lastName: strCustomerLname,
                                                phone: strCustomerPhone,
                                                ppaiNumber: strCustomerPpaiNumber,
                                                asiNumber: strCustomerASINumber,
                                                address1: strCustomerAddr1,
                                                address2: strCustomerAddr2,
                                                city: strCustomerCity,
                                                state: strCustomerState,
                                                zipCode: strCustomerZipCode,
                                                country: strCustomerCountry,
                                            }
                                        }
                                    }
                                    if (key == 'lineItems'){
                                        let intItemId = null
                                        let strItemName = null
                                        let arrLineItemData = objData[key]
                                        log.debug('afterSubmit arrLineItemData', arrLineItemData)

                                        arrLineItemData.forEach(data => {
                                            let strFinalSKU = data.finalSKU
                                            let strSKU = data.sku
                                            let strDescription = data.description
                                            let strColor = data.itemColor
                                            let intQuantity = data.quantity
                                            let intRate = data.unitPrice
                                            let intAmount = data.totalPrice

                                            let objLogs = {
                                                strFinalSKU: strFinalSKU,
                                                strSKU: strSKU,
                                                strDescription: strDescription,
                                                strColor: strColor
                                            }
                                            
                                            log.debug('afterSubmit objLogs', objLogs)

                                            const arrFilteredByFinalSKU = arrItemSearch.filter(item =>
                                                item.itemid.toLowerCase().endsWith(strFinalSKU.toLowerCase())
                                            );
                                            log.debug('afterSubmit arrFilteredByFinalSKU', arrFilteredByFinalSKU)

                                            if (arrFilteredByFinalSKU.length == 1){
                                                intItemId = arrFilteredByFinalSKU[0].internalId
                                                strItemName = arrFilteredByFinalSKU[0].itemid
                                                arrItemData.push({
                                                    item: intItemId,
                                                    sku: strSKU,
                                                    description: strDescription,
                                                    itemname: strItemName,
                                                    quantity: intQuantity,
                                                    rate: intRate,
                                                    amount: intAmount,
                                                    filterby: 'Filtered By Final SKU'
                                                })
                                            } else {
                                                if (strFinalSKU == 'Set up'){
                                                    arrItemData.push({
                                                        item: SET_UP,
                                                        sku: strSKU,
                                                        description: strDescription,
                                                        itemname: strFinalSKU,
                                                        quantity: intQuantity,
                                                        rate: intRate,
                                                        amount: intAmount,
                                                        filterby: 'Default By Set up'
                                                    })
                                                } else {
                                                    if (strColor){
                                                        arrItemData.push({
                                                            item: OE_MISC_ITEM,
                                                            sku: strSKU,
                                                            description: strDescription,
                                                            itemname: strFinalSKU,
                                                            quantity: intQuantity,
                                                            rate: intRate,
                                                            amount: intAmount,
                                                            filterby: 'Default By OE_MISC_ITEM'
                                                        })
                                                    } else {
                                                        if (intQuantity >= 2){
                                                            arrItemData.push({
                                                                item: OE_MISC_ITEM,
                                                                sku: strSKU,
                                                                description: strDescription,
                                                                itemname: strFinalSKU,
                                                                quantity: intQuantity,
                                                                rate: intRate,
                                                                amount: intAmount,
                                                                filterby: 'Default By OE_MISC_ITEM'
                                                            })
                                                        } else {
                                                            arrItemData.push({
                                                                item: OE_MISC_CHARGE,
                                                                sku: strSKU,
                                                                description: strDescription,
                                                                itemname: strFinalSKU,
                                                                quantity: intQuantity,
                                                                rate: intRate,
                                                                amount: intAmount,
                                                                filterby: 'Default By OE_MISC_CHARGE'
                                                            })
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    }     
                                    if (key == 'specialInstructions'){
                                        let strInstructions = objData[key]
                                        arrMemo.push(strInstructions)
                                    }
                                    if (key == 'additionalNotes'){
                                        let arrAddNotes = objData[key]
                                        arrMemo = [...arrMemo, ...arrAddNotes]
                                    }
                                }

                                objSOData.lineItems = arrItemData
                                objSOData.memo = arrMemo
                                objSOData.shipping = objShipToData
                                objSOData.location = IRWINDALE_00_IN_HOUSE
                                objSOData.oe_misc_item = OE_MISC_ITEM
                                objSOData.oe_misc_charge = OE_MISC_CHARGE
                                objSOData.unidentified_ship_method = UNIDENTIFIED_SHIPPING_METHOD

                                log.debug("afterSubmit objSOData", objSOData)


                                if (objSOData.customerId){
                                    objSOData.newCustomer = false
                                    intSalesOrderId = createSalesOrder(objSOData)

                                } else {
                                    let customerId = createCustomer(objCustomerParam)

                                    if (customerId){
                                        objSOData.newCustomer = true
                                        objSOData.customerId = customerId
                                        intSalesOrderId = createSalesOrder(objSOData)
                                    }
                                }

                                if(intSalesOrderId){

                                    let pdfId = objRecord.getValue({
                                        fieldId: 'custrecord_related_pdf',
                                    });
                                    log.debug('pdfId', pdfId)
            
                                    objRecord.setValue({
                                        fieldId: 'custrecord_related_so',
                                        value: intSalesOrderId
                                    });

                                    objRecord.setValue({
                                        fieldId: 'custrecord_haserror',
                                        value: false
                                    });

                                    objRecord.setValue({
                                        fieldId: 'custrecord_error_message',
                                        value: null
                                    });

                                    record.attach({
                                        record: {
                                            type: 'file',
                                            id: pdfId
                                        },
                                        to: {
                                            type: 'salesorder',
                                            id: intSalesOrderId
                                        }
                                    });
                                }
                      

                            } catch (e) {
                                log.error('afterSubmit Error Creating Sales Order', e.message)
                                arrErrorMessage.push(e.message)
                            }
                        }

                    }

                    objRecord.setValue({
                        fieldId: 'custrecord_isprocess',
                        value: true
                    });

                    log.error('afterSubmit arrErrorMessager', arrErrorMessage)
                    if (arrErrorMessage.length > 0){
                        let strErrorMsg = arrErrorMessage.join(', ')
                        objRecord.setValue({
                            fieldId: 'custrecord_haserror',
                            value: true
                        });
    
                        objRecord.setValue({
                            fieldId: 'custrecord_error_message',
                            value: strErrorMsg
                        });

                        let objEmailParam = {
                            author: currentUser.id,
                            poId: strPoNumber,
                            errorMsg: strErrorMsg,
                            recordId: intRecordId,
                            recordType: strRecordType,
                            jsonData: JSON.parse(strJsonData)
                        }

                        sendEmailError(objEmailParam)

                    } else {
                        objRecord.setValue({
                            fieldId: 'custrecord_haserror',
                            value: false
                        });
    
                        objRecord.setValue({
                            fieldId: 'custrecord_error_message',
                            value: null
                        });

                    }

                    objRecord.setValue({
                        fieldId: 'custrecord_validated_json',
                        value: JSON.stringify(objSOData)
                    });

                    let metrixPOEngineRecId = objRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('metrixPOEngineRecId updated', metrixPOEngineRecId)

                }
            }
        };

        // Private Functions
        const sendEmailError = (objEmailParam) => {
            try {
                let objBodyMessage = `
                    Error: ${objEmailParam.errorMsg}

                    Data:
                    ${JSON.stringify(objEmailParam.jsonData, null, 4)}
                `;

                email.send({
                    author: objEmailParam.author,
                    recipients: ['michaelp@metrixdigital.com'],
                    subject: `SO creation ${objEmailParam.poId}`,
                    body: objBodyMessage,
                    relatedRecords: {
                        customRecord: {
                            id: objEmailParam.recordId,
                            recordType: objEmailParam.recordType
                        }
                    }
                });
            } catch (error) {
                log.error('sendEmailError', error.message)
            }
        }

        const searchCustomer = (strCustomerEmail) => {
            let arrCustomer = [];
            try {
                let objEntitySearch = search.create({
                    type: 'customer',
                    filters:  ['email', 'is', strCustomerEmail],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        // pricelevel
                    ]
                });
                
                var searchResultCount = objEntitySearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objEntitySearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                            arrCustomer.push({
                                    internalId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                log.error('searchCustomer', error.message);
                arrErrorMessage.push(error.message);
            }
            log.debug('searchCustomer arrCustomer', arrCustomer)
            return arrCustomer; 
        }

        const searchItem = () => {
            let arrItem = [];
              try {
                  let objSearch = search.create({
                      type: 'item',
                      filters:  [
                        ['matrix', 'is', 'F'],
                        'AND',
                        ['isinactive', 'is', 'F'],
                      ],
                      columns: [
                          search.createColumn({ name: 'internalid' }),
                          search.createColumn({ name: 'displayname' }),
                          search.createColumn({ name: 'itemid' }),
                      ]
                  });
                  
                  var searchResultCount = objSearch.runPaged().count;
                  if (searchResultCount != 0) {
                      var pagedData = objSearch.runPaged({pageSize: 1000});
                      for (var i = 0; i < pagedData.pageRanges.length; i++) {
                          var currentPage = pagedData.fetch(i);
                          var pageData = currentPage.data;
                          if (pageData.length > 0) {
                              for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrItem.push({
                                      internalId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                      description: pageData[pageResultIndex].getValue({name: 'displayname'}),
                                      itemid: pageData[pageResultIndex].getValue({name: 'itemid'}),
                                  });
                              }
                          }
                      }
                  }
              } catch (error) {
                  log.error('searchItem', error.message);
                  arrErrorMessage.push(error.message);
              }
              return arrItem;
        }

        const searchShipMethod = () => {
            let arrShipMethod = [];
              try {
                  let objSearch = search.create({
                      type: 'shipitem',
                      filters:  [
                        ['formulatext: {account}', 'isnotempty', ''],
                        'AND',
                        ['isinactive', 'is', 'F']
                      ],
                      columns: [
                          search.createColumn({ name: 'internalid' }),
                          search.createColumn({ name: 'displayname' }),
                          search.createColumn({ name: 'itemid' }),
                      ]
                  });
                  
                  var searchResultCount = objSearch.runPaged().count;
                  if (searchResultCount != 0) {
                      var pagedData = objSearch.runPaged({pageSize: 1000});
                      for (var i = 0; i < pagedData.pageRanges.length; i++) {
                          var currentPage = pagedData.fetch(i);
                          var pageData = currentPage.data;
                          if (pageData.length > 0) {
                              for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrShipMethod.push({
                                      internalId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                      displayname: pageData[pageResultIndex].getValue({name: 'displayname'}),
                                      itemid: pageData[pageResultIndex].getValue({name: 'itemid'}),
                                  });
                              }
                          }
                      }
                  }
              } catch (error) {
                  log.error('searchShipMethod', error.message);
                  arrErrorMessage.push(error.message);
              }
              log.debug('searchShipMethod arrShipMethod', arrShipMethod)
              return arrShipMethod;
        }

        const searchShippingAddress = (customerId) => {
            let arrShippingAddress = [];
              try {
                  let objSearch = search.create({
                      type: 'customer',
                      filters:  ['internalid', 'anyof', customerId],
                      columns: [
                          search.createColumn({ name: 'internalid' }),
                          search.createColumn({ name: 'altname' }),
                          search.createColumn({ name: 'address' }),
                          search.createColumn({ name: 'addressinternalid' }),
                      ]
                  });
                  
                  var searchResultCount = objSearch.runPaged().count;
                  if (searchResultCount != 0) {
                      var pagedData = objSearch.runPaged({pageSize: 1000});
                      for (var i = 0; i < pagedData.pageRanges.length; i++) {
                          var currentPage = pagedData.fetch(i);
                          var pageData = currentPage.data;
                          if (pageData.length > 0) {
                              for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrShippingAddress.push({
                                      internalId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                      name: pageData[pageResultIndex].getValue({name: 'altname'}),
                                      address: pageData[pageResultIndex].getValue({name: 'address'}),
                                      addressId: pageData[pageResultIndex].getValue({ name: 'addressinternalid' }),
                                  });
                              }
                          }
                      }
                  }
              } catch (error) {
                  log.error('searchShippingAddress', error.message);
                  arrErrorMessage.push(error.message);
              }
              log.debug('searchShippingAddress arrShippingAddress', arrShippingAddress)
              return arrShippingAddress;   
        }

        const createSalesOrder = (objSOData) => {
            log.debug('createSalesOrder objSOData', objSOData)
            let intCustomerId = objSOData.customerId
            let objShipToData = objSOData.shipping ? objSOData.shipping : {}
            let strShippingAddress1 = objSOData.shipping.address1 ? objSOData.shipping.address1 : null
            let strShippingCity = objSOData.shipping.city ? objSOData.shipping.city : null
            let strShippingName = objSOData.shipping.company ? objSOData.shipping.company : null
            let intShipId = null
            let salesOrderId = null
            try {
                let objRecord = record.create({
                    type: 'salesorder',
                    isDynamic: true
                })

                objRecord.setValue({
                    fieldId: 'entity',
                    value: objSOData.customerId
                })
                
                objRecord.setValue({
                    fieldId: 'otherrefnum',
                    value: objSOData.otherRef
                })

                objRecord.setValue({
                    fieldId: 'trandate',
                    value: objSOData.orderDate ? new Date(objSOData.orderDate) : null
                })

                objRecord.setValue({
                    fieldId: 'custbody5',
                    value: objSOData.inHandsDate ? new Date(objSOData.inHandsDate) : null
                })
                    
                objRecord.setValue({
                    fieldId: 'custbodyhcl_eo_notes',
                    value: 'Please refer to PO for additional notes'
                })

                objRecord.setValue({
                    fieldId: 'custbodyhcl_new_cust_created',
                    value: objSOData.newCustomer
                })

                objRecord.setValue({
                    fieldId: 'shipmethod',
                    value: objSOData.shipMethodId
                })

                let arrShippingData = searchShippingAddress(intCustomerId)

                if (arrShippingData.length > 0){
                    log.debug('createSalesOrder strShippingAddress', strShippingAddress1)
                    
                    if (strShippingAddress1){
                        const arrFilteredByShipAddr1 = arrShippingData.filter(item =>
                            item.address.toLowerCase().includes(strShippingAddress1.toLowerCase())
                        );
                        if (arrFilteredByShipAddr1 == 1){
                            intShipId = arrFilteredByShipAddr1[0].internalId
                        } else if (arrFilteredByShipAddr1 > 1) {
                            const arrFilteredByShipCity = arrShippingData.filter(item =>
                                item.address.toLowerCase().includes(strShippingCity.toLowerCase())
                            );
                            if (arrFilteredByShipCity == 1){
                                intShipId = arrFilteredByShipCity[0].internalId
                            }
                        } else {
                            const arrFilteredByShipName = arrShippingData.filter(item =>
                                item.address.toLowerCase().includes(String(strShippingName).toLowerCase())
                            );
                            if (arrFilteredByShipName >= 1){
                                intShipId = arrFilteredByShipName[0].internalId
                            } else {
                                if (Object.keys(objShipToData).length > 0){
                                    let customerId = createDefaultShippingAddress(intCustomerId, objShipToData)
                                    intShipId = updateDefaultShippingAddress(customerId, strShippingAddress1)
                                }
                            }
                        }
                    }
                    
                }
                log.debug('createSalesOrder intShipId', intShipId)

                objRecord.setValue({
                    fieldId: 'shipaddresslist',
                    value: intShipId ? intShipId : null
                })

                objSOData.lineItems.forEach(data => {
                    let arrItemDescription = []

                    objRecord.selectNewLine({
                        sublistId: 'item'
                    });
                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: objSOData.location
                    });
                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: data.item
                    });
                                        
                    if (data.item == objSOData.oe_misc_charge || data.item == objSOData.oe_misc_item) {
                        let skuDescription = 'SKU: ' + data.sku;
                        let itemDescription = 'Description: ' + data.description;
                    
                        if (!arrItemDescription.includes(skuDescription)) {
                            arrItemDescription.push(skuDescription);
                        }
                        if (!arrItemDescription.includes(itemDescription)) {
                            arrItemDescription.push(itemDescription);
                        }
                    }
                    

                    if (arrItemDescription.length > 0){
                        objRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            value: arrItemDescription.join('\n')
                        });  
                    }
                   
                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: data.quantity ? data.quantity : 1
                    });

                    if (data.item == objSOData.oe_misc_charge || data.item == objSOData.oe_misc_item){
                        objRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: data.rate ? data.rate : 0
                        });
    
                        objRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: data.amount ? data.amount : 0
                        });
                    }


                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: -7 // -Not Taxable-
                    });
                    
                    objRecord.commitLine({
                        sublistId: 'item'
                    });
                });

                salesOrderId = objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("createSalesOrder salesOrderId", salesOrderId)

            } catch (error) {
                log.error('createSalesOrder', error.message);
                arrErrorMessage.push(error.message);
            }

            return salesOrderId
        }

        const createCustomer = (objCustomerParam) => {
            log.debug("createCustomer objCustomerParam", objCustomerParam)

            let customerId = null
            try {
                if (Object.keys(objCustomerParam).length !== 0) {
                    let objCustomerRecord = record.create({
                        type: record.Type.CUSTOMER,
                        isDynamic: true
                    });
                   
                    objCustomerRecord.setValue({ fieldId: 'companyname', value: objCustomerParam.companyName });
                    objCustomerRecord.setValue({ fieldId: 'email', value: objCustomerParam.email });
                    objCustomerRecord.setValue({ fieldId: 'phone', value: objCustomerParam.phone });
                    objCustomerRecord.setValue({ fieldId: 'custentity13', value: objCustomerParam.ppaiNumber });
                    objCustomerRecord.setValue({ fieldId: 'custentity12', value: objCustomerParam.custentity12 });


                    if (objCustomerParam.country){
                        objCustomerRecord.selectNewLine({
                            sublistId : "addressbook"
                        });
    
                        let myaddressSubrecord = objCustomerRecord.getCurrentSublistSubrecord({
                            sublistId : "addressbook",
                            fieldId : "addressbookaddress"
                        });
    
                        myaddressSubrecord.setText({
                            fieldId: "country",
                            text: 'United States'
                        });
    
                        myaddressSubrecord.setValue({
                            fieldId : "attention",
                            value : objCustomerParam.name
                        })
                        
                        myaddressSubrecord.setValue({
                            fieldId : "addressee",
                            value : objCustomerParam.company
                        })
    
                        myaddressSubrecord.setValue({
                            fieldId : "zip",
                            value : objCustomerParam.zipCode
                        })
    
                        myaddressSubrecord.setValue({
                            fieldId : "city",
                            value : objCustomerParam.city    
                        });
    
                        myaddressSubrecord.setText({
                            fieldId : "state",
                            text : objCustomerParam.state    
                        });
    
                        myaddressSubrecord.setValue({
                            fieldId : "addr1",
                            value : objCustomerParam.address1    
                        });
    
                        myaddressSubrecord.setValue({
                            fieldId : "addr2",
                            value : objCustomerParam.address2    
                        });
    
                        myaddressSubrecord.setValue({
                            fieldId : "addrphone",
                            value : objCustomerParam.phone    
                        });
    
                        objCustomerRecord.commitLine({
                            sublistId : "addressbook"
                        });    
                    }

                    customerId = objCustomerRecord.save({
                       enableSourcing: true,
                       ignoreMandatoryFields: true
                    });
                }
            } catch (error) {
                log.error('createCustomer', error.message);
                arrErrorMessage.push(error.message);
            }
            log.debug("createCustomer customerId", customerId)
            return customerId
        }

        const createDefaultShippingAddress = (intCustomerId, objShipToData) => {
            let objParam = {
                customer: intCustomerId,
                shipTo: objShipToData
            }
            log.debug("createDefaultShippingAddress parameter", objParam)
            let customerId = intCustomerId
            try {
                if (customerId && objShipToData.country) {
                    let objCustomerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id : customerId,
                        isDynamic: true
                    });

                    objCustomerRecord.selectNewLine({
                        sublistId : "addressbook"
                    });

                    let myaddressSubrecord = objCustomerRecord.getCurrentSublistSubrecord({
                        sublistId : "addressbook",
                        fieldId : "addressbookaddress"
                    });

                    myaddressSubrecord.setText({
                        fieldId : "country",
                        text: 'United States'
                    })

                    myaddressSubrecord.setValue({
                        fieldId : "attention",
                        value : objShipToData.name
                    })
                    
                    myaddressSubrecord.setValue({
                        fieldId : "addressee",
                        value : objShipToData.company
                    })

                    myaddressSubrecord.setValue({
                        fieldId : "zip",
                        value : objShipToData.zipCode
                    })

                    myaddressSubrecord.setValue({
                        fieldId : "city",
                        value : objShipToData.city    
                    });

                    myaddressSubrecord.setText({
                        fieldId : "state",
                        text : objShipToData.state    
                    });

                    myaddressSubrecord.setValue({
                        fieldId : "addr1",
                        value : objShipToData.address1    
                    });

                    myaddressSubrecord.setValue({
                        fieldId : "addr2",
                        value : objShipToData.address2    
                    });

                    myaddressSubrecord.setValue({
                        fieldId : "addrphone",
                        value : objShipToData.phone    
                    });

                    objCustomerRecord.commitLine({
                        sublistId : "addressbook"
                    });

                    customerId = objCustomerRecord.save({
                       enableSourcing: true,
                       ignoreMandatoryFields: true
                    });
                }
            } catch (error) {
                log.error('createDefaultShippingAddress', error.message);
                arrErrorMessage.push(error.message);
            }
            log.debug("createDefaultShippingAddress customerId", customerId)
            return customerId
        }

        const updateDefaultShippingAddress = (customerId, strShippingAddress1) => {
            log.debug("updateDefaultShippingAddress customerId", customerId)
            let intDefaultAddress = null
            try {
                if (customerId) {
                    let objCustomerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id : customerId,
                        isDynamic: true
                    });
                    if (objCustomerRecord){
                        let numLines = objCustomerRecord.getLineCount({ sublistId: 'addressbook' });

                        for (let x = 0; x < numLines; x++) {
                            let strAddress = objCustomerRecord.getSublistValue({ sublistId: 'addressbook', fieldId: 'addressbookaddress_text', line: x });
                            if(strAddress.includes(strShippingAddress1)){
                                intDefaultAddress = objCustomerRecord.getSublistValue({ sublistId: 'addressbook', fieldId: 'addressid', line: x });
                            }
                        }

                        objCustomerRecord.save({
                           enableSourcing: true,
                           ignoreMandatoryFields: true
                        });
                    }

                }
            } catch (error) {
                log.error('updateDefaultShippingAddress', error.message);
                arrErrorMessage.push(error.message);
            }
            log.debug("updateDefaultShippingAddress intDefaultAddress", intDefaultAddress)
            return intDefaultAddress
        }
        return { afterSubmit };

    });
