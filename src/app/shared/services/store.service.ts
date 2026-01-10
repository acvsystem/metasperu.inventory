import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    private isExpire: boolean;
    private timeExpireMinuto: number;
    constructor() {
        this.isExpire = false;
        this.timeExpireMinuto = 1;
    }

    setStore(key: string, value: any, isExpire?: boolean) {
        if (isExpire) {
            this.isExpire = true;
            let ObjValue = { value_: value, timestamp_: new Date().getTime() };
            localStorage.setItem(key, JSON.stringify(ObjValue));
        }
        else {
            localStorage.setItem(key, value);
        }
    }

    getStore(key: string) {
        try {
            if ((localStorage.getItem(key) || []).length > 0) {
                if (this.IsJsonString(localStorage.getItem(key))) {
                    let value = JSON.parse((localStorage.getItem(key) || ""));
                    try {
                        if (value.hasOwnProperty('timestamp_')) {
                            let time = value.timestamp_;
                            let now = new Date().getTime().toString();
                            if (parseInt(now) - time > this.timeExpireMinuto * 60000) {
                                this.clearAllStore();
                            }
                        }
                        else {
                            return value;
                        }
                    } catch (err) {
                        return value;
                    }
                }
                else {
                    let value_ = localStorage.getItem(key);
                    return { value: value_ }
                }
            }
            else {
                return null;
            }
        } catch (e) {
            return '';
        }

    }

    removeStore(key: string) {
        localStorage.removeItem(key);
    }

    clearAllStore() {
        localStorage.clear();
    }

    private IsJsonString(str: any) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
}
