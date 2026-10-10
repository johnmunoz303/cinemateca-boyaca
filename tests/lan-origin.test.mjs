import test from 'node:test';
import assert from 'node:assert/strict';
import {isLocalFrontendOrigin} from '../backend/src/modules/auth/lan-origin.mjs';
test('LAN accepts changing private IPs only for the same frontend host and port', () => {
  for(const ip of ['192.168.0.107','192.168.160.160','10.0.0.2','172.20.1.2']) {
    assert.equal(isLocalFrontendOrigin(`http://${ip}:3000`,`${ip}:3000`,'http://localhost:3000'),true);
  }
  for(const [origin,host] of [['https://evil.example','evil.example'],['http://8.8.8.8:3000','8.8.8.8:3000'],['http://192.168.0.107:3000','192.168.0.108:3000'],['http://192.168.0.107:9000','192.168.0.107:9000'],['null',''],['http://192.168.0.107:3000','192.168.0.107:3000,evil.example']]) {
    assert.equal(isLocalFrontendOrigin(origin,host,'http://localhost:3000'),false);
  }
});
