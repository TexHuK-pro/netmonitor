export namespace main {
	
	export class HostEntry {
	    id: number;
	    name: string;
	    addr: string;
	    status: string;
	    latency: string;
	
	    static createFrom(source: any = {}) {
	        return new HostEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.addr = source["addr"];
	        this.status = source["status"];
	        this.latency = source["latency"];
	    }
	}

}

