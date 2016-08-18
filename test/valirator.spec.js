import { registerRule, hasRule, formatMessage, validate, ValidationSchema } from '../dist/valirator';

describe('valirator', () => {
  describe('registerRule', () => {
    it('should register rule', () => {
      registerRule('myRule', () => true, 'error');

      expect(hasRule('myRule')).toBe(true);
    });
  });

  describe('formatMessage', () => {
    it('should format text', (done) => {
      formatMessage('%{actual} === %{expected}', 5, 5)
        .then(formattedMessage  => {
          expect(formattedMessage).toBe('5 === 5');

          done();
        });
    });

    it('should accept function', (done) => {
      formatMessage((actual, expected) => {
        return `${actual} === ${expected}`;
      }, 5, 5)
        .then(formattedMessage => {
          expect(formattedMessage).toBe('5 === 5');

          done();
        });
    });

    it('should have default message', (done) => {
      formatMessage()
        .then(formattedMessage => {
          expect(formattedMessage).toBeDefined();

          done();
        })
    });
  });

  describe('validate', () => {
    it('should validate required rule', (done) => {
      const obj = {
        FirstName: null
      };

      const schema = {
        properties: {
          FirstName: {
            rules: {
              required: true
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.required).toBeDefined();

          done();
        });
    });

    it('should override default global message', (done) => {
      const obj = {
        FirstName: null
      };

      const schema = {
        messages: {
          required: 'Field is required'
        },
        properties: {
          FirstName: {
            rules: {
              required: true
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.required).toBe('Field is required');

          done();
        });
    });

    it('should override default required rule (allow empty, for example)', (done) => {
      const obj = {
        FirstName: ''
      };

      const schema = {
        rules: {
          required: (value) => {
            return value !== undefined && value !== null;
          }
        },
        properties: {
          FirstName: {
            rules: {
              required: true
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.required).not.toBeDefined();

          done();
        });
    });

    it('should support nested schemas', (done) => {
      const obj = {
        Person: {
          FirstName: null
        }
      };

      const schema = {
        properties: {
          Person: {
            rules: {
              required: true,
            },
            properties: {
              FirstName: {
                rules: {
                  required: true
                }
              }
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.Person.FirstName.required).toBeDefined();

          done();
        });
    });

    it('should support array schemas', (done) => {
      const obj = {
        Persons: [{
          FirstName: 'John'
        },{
          FirstName: null
        }, {
          FirstName: 'Bob'
        }]
      };

      const schema = {
        properties: {
          Persons: {
            properties: {
              FirstName: {
                rules: {
                  required: true
                }
              }
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.Persons[0].FirstName.required).not.toBeDefined();
          expect(errors.Persons[1].FirstName.required).toBeDefined();
          expect(errors.Persons[2].FirstName.required).not.toBeDefined();

          done();
        });
    });

    it('should support custom rule', (done) => {
      const obj = {
        FirstName: 2
      };

      const schema = {
        rules: {
          myRule: (actual, expected) => {
            return actual === expected * 2;
          }
        },
        messages: {
          myRule: '%{actual} !== %{expected} * 2'
        },
        properties: {
          FirstName: {
            rules: {
              min: 6,
              myRule: 2
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.min).toBeDefined();
          expect(errors.FirstName.myRule).toBe('2 !== 2 * 2');

          done();
        });
    });

    it('should support async rule', (done) => {
      const obj = {
        FirstName: 2
      };

      const schema = {
        rules: {
          myRule: (actual, expected) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(actual === expected * 2);
              }, 10);
            });
          }
        },
        messages: {
          myRule: '%{actual} !== %{expected} * 2'
        },
        properties: {
          FirstName: {
            rules: {
              min: 6,
              myRule: 2
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.min).toBeDefined();
          expect(errors.FirstName.myRule).toBe('2 !== 2 * 2');

          done();
        });
    });

    it('should support async message', (done) => {
      const obj = {
        FirstName: 2
      };

      const schema = {
        rules: {
          myRule: (actual, expected) => {
            return actual === expected * 2;
          }
        },
        messages: {
          myRule: (actual, expected) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(`${actual} !== ${expected} * 2`);
              }, 10);
            });
          }
        },
        properties: {
          FirstName: {
            rules: {
              min: 6,
              myRule: 2
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.min).toBeDefined();
          expect(errors.FirstName.myRule).toBe('2 !== 2 * 2');

          done();
        });
    });

    it('should not fail on empty schema', (done) => {
      const obj = {
        FirstName: 2
      };

      const schema = {
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors).toEqual({});

          done();
        });
    });

    it('should not fail on empty obj', (done) => {
      const obj = {
      };

      const schema = {
        properties: {
          FirstName: {
            rules: {
              required: true
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.required).toBeDefined();

          done();
        });
    });

    it('should support high level schema', (done) => {
      const obj = {
        FirstName: null
      };

      const schema = {
        FirstName: {
          rules: {
            required: true
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          expect(errors.FirstName.required).toBeDefined();

          done();
        });
    });

    it('should be fast', (done) => {
      console.time('should be fast');
      const obj = {
        "Id": "9131",
        "AccountId": "1",
        "UserId": null,
        "FirstName": "Test",
        "LastName": "Test",
        "Line1": "15625 Alton Pkwy",
        "Line2": "Suite 200",
        "City": "Irvine",
        "State": "CA",
        "Zip": "92620",
        "Country": "US",
        "Phone": "+1-2345678901",
        "Phone2": "2342342341",
        "Company": "Test",
        "Email": "test@example.com",
        "Type": "primary"
      };

      const schema = {
        messages: {
          required: 'validation.required'
        },
        properties: {
          FirstName: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 45,
              pattern: /^[a-zA-Z0-9]+$/
            },
            messages: {
              pattern: 'validation.firstName.pattern'
            }
          },
          LastName: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 45,
              pattern: /^[a-zA-Z0-9]+$/
            },
            messages: {
              pattern: 'validation.firstName.pattern'
            }
          },
          Email: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 50,
              format: 'email'
            },
            messages: {
              format: 'validation.email.format'
            }
          },
          Phone: {
            rules: {
              type: 'string',
              required: true
            }
          },
          Line1: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 100
            }
          },
          Line2: {
            rules: {
              type: 'string',
              maxLength: 100
            }
          },
          Country: {
            rules: {
              type: 'string',
              required: true
            }
          },
          State: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 50
            }
          },
          City: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 50
            }
          },
          Zip: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 15
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          console.timeEnd('should be fast');

          done();
        });
    });

    it('should be fast with array', (done) => {
      console.time('should be fast with array');
      const obj = {
        "Id": "1",
        "Name": "CalAmp Account",
        "ParentAccount": "0",
        "SolomonId": "GAC22222222",
        "CreditTerms": "COD",
        "SalesTerritory": "US West",
        "Language": "english",
        "PartnerBranding": "calamp",
        "CreditPurchaseAuthorized": "0",
        "ActivationDate": null,
        "DeactivationDate": null,
        "IsDisabled": "no",
        "IsMarkedArchive": "no",
        "CanViewSubaccounts": "1",
        "PartnerLogo": "calamp_logo_slogan_1_125px.jpg",
        "ShowPoweredByLogo": "1",
        "AllowNewDeviceUseFromParent": "0",
        "CanViewAirtimeStore": "1",
        "CanViewHardwareStore": "0",
        "LastChangeDate": "2016-08-12 05:37:24",
        "AllowCommandAutoRetry": "1",
        "SkipInstallProcess": "0",
        "AllowAirtimeAutoRenew": "1",
        "InvoiceAccount": "0",
        "EmailNotificationOnInstall": "1",
        "MandatoryInstallOdometer": "0",
        "RenewalPlanId": "4",
        "RenewalPlanPrice": null,
        "EnableLocationValidationReport": "1",
        "ParentName": "N/A",
        "MaxScheduleActions": 12,
        "is_cac_account": false,
        "CustomUserAttributeDefinitions": [],
        "CustomVehicleAttributeDefinitions": [],
        "AirTimePlan": [
          {
            "RenewalPlanSKU": "rp1111",
            "RenewalPlanPrice": "33.33"
          },
          {
            "RenewalPlanSKU": "rp2222",
            "RenewalPlanPrice": "444.44"
          },
          {
            "RenewalPlanSKU": "aa",
            "RenewalPlanPrice": ""
          },
          {
            "RenewalPlanSKU": "",
            "RenewalPlanPrice": "aa"
          },
          {
            "RenewalPlanSKU": "",
            "RenewalPlanPrice": ""
          }
        ]
      };

      const airTimePlanRowRequired = (actual, expected, property, { RenewalPlanSKU, RenewalPlanPrice }, schema, defaultRule) => {
        let isRequired = {
          allowEmpty: true
        };

        if (RenewalPlanSKU || RenewalPlanPrice) {
          isRequired = true
        }

        return defaultRule(actual, isRequired)
      };

      const schema = {
        messages: {
          required: 'validation.required'
        },
        properties: {
          Name: {
            rules: {
              type: 'string',
              required: true,
              maxLength: 64
            }
          },
          Language: {
            rules: {
              type: 'string',
              required: true
            }
          },
          AirTimePlan: {
            rules: {
              required: true
            },
            properties: {
              RenewalPlanSKU: {
                rules: {
                  required: airTimePlanRowRequired,
                  pattern: /^RP|rp[0-9]{4}$/
                },
                messages: {
                  pattern: 'validation.renewalPlanSKU.pattern'
                }
              },
              RenewalPlanPrice: {
                rules: {
                  required: airTimePlanRowRequired,
                  pattern: /^[0-9]+\.?[0-9]{2}$/
                },
                messages: {
                  pattern: 'validation.renewalPlanPrice.pattern'
                }
              }
            }
          }
        }
      };

      validate(schema, obj)
        .then(errors => {
          console.timeEnd('should be fast with array');

          done();
        });
    });
  });

  describe('ValidationSchema', () => {
    it('should support ValidationSchema for multiple validations', (done) => {
      const obj = {
        FirstName: 2
      };

      const schema = new ValidationSchema({
        rules: {
          myRule: (actual, expected) => {
            return actual === expected * 2;
          }
        },
        messages: {
          myRule: (actual, expected) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(`${actual} !== ${expected} * 2`);
              }, 10);
            });
          }
        },
        properties: {
          FirstName: {
            rules: {
              min: 6,
              myRule: 2
            }
          }
        }
      });

      schema.validate(obj)
        .then(errors => {
          expect(errors.FirstName.min).toBeDefined();
          expect(errors.FirstName.myRule).toBe('2 !== 2 * 2');

          done();
        });
    });
  });
});
