import os from 'os';


/* 
* Retrieves the first non-internal IPv4 address of the machine.
* Throws an error if no valid address is found.
* Returns the IPv4 address as a string.
*/


function getIpv4Address(): string {
  const interfaces = os.networkInterfaces();
  console.log(interfaces);
  
}
export { getIpv4Address };



getIpv4Address();





/* 

{
    "vEthernet (WSL (Hyper-V firewall))": [
      {
        address: "fe80::7b57:b64:412d:bb31",
        netmask: "ffff:ffff:ffff:ffff::",
        family: "IPv6",
        mac: "00:15:5d:a2:9a:81",
        internal: false,
        cidr: "fe80::7b57:b64:412d:bb31/64",
        scopeid: 41,
      }, {
        address: "192.168.208.1",
        netmask: "255.255.240.0",
        family: "IPv4",
        mac: "00:15:5d:a2:9a:81",
        internal: false,
        cidr: "192.168.208.1/20",
      }
    ],
    "Wi-Fi": [
      {
        address: "fe80::f02c:ad1e:c946:838c",
        netmask: "ffff:ffff:ffff:ffff::",
        family: "IPv6",
        mac: "c4:d0:e3:3f:12:7c",
        internal: false,
        cidr: "fe80::f02c:ad1e:c946:838c/64",
        scopeid: 18,
      }, {
        address: "172.21.56.255",
        netmask: "255.255.248.0",
        family: "IPv4",
        mac: "c4:d0:e3:3f:12:7c",
        internal: false,
        cidr: "172.21.56.255/21",
      }
    ],
    "Loopback Pseudo-Interface 1": [
      {
        address: "::1",
        netmask: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
        family: "IPv6",
        mac: "00:00:00:00:00:00",
        internal: true,
        cidr: "::1/128",
        scopeid: 0,
      }, {
        address: "127.0.0.1",
        netmask: "255.0.0.0",
        family: "IPv4",
        mac: "00:00:00:00:00:00",
        internal: true,
        cidr: "127.0.0.1/8",
      }
    ],
  }

*/