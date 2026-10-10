import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,signPayload,verifyPayload} from '../backend/src/modules/auth/security.mjs';
test('contraseñas con sal única y comprobación segura',()=>{const a=hashPassword('Una-frase-larga-123'),b=hashPassword('Una-frase-larga-123');assert.notEqual(a,b);assert.equal(verifyPassword('Una-frase-larga-123',a),true);assert.equal(verifyPassword('incorrecta',a),false);assert.equal(verifyPassword('x','corrupto'),false)});
test('firma rechaza manipulación, claves distintas y vencimiento',()=>{const secret='a'.repeat(64),signed=signPayload({uid:1,exp:Date.now()+10000},secret);assert.equal(verifyPayload(signed,secret).uid,1);assert.equal(verifyPayload(signed+'x',secret),null);assert.equal(verifyPayload(signed,'b'.repeat(64)),null);assert.equal(verifyPayload(signPayload({exp:Date.now()-1},secret),secret),null)});
