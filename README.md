![Logo](admin/logo.png)
# ioBroker.labcom

### 0.0.4
* ([@100prznt](https://github.com/100prznt/)) provide meas values as number and set the unit property, by @100prznt

### Description
This adapter fetches your latest measurements from labcom.cloud

### Usage
* Install this adapter to ioBroker
* Create an instance of this adapter
* Enter your LabCom API token, which can be created on https://labcom.cloud/settings
* Define which accounts should be monitored in ioBroker (either enter "0" for all accounts, or enter the desired account IDs comma separated)
* The adapter is preconfigured to fetch the latest data every minute, this can be changed in the instance overview

## Changelog
* 0.0.1 Inital release
* 0.0.2 incomplete config patch
* 0.0.3 added translations, restructured data points
* 0.0.4 provide meas values as number and set the unit property

## License
MIT License

Copyright (c) 2020 LemonShock <dev.lemonshock@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
