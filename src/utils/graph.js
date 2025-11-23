// Simple undirected graph using adjacency list for buyer-seller relationships
export class Graph {
  constructor(){ this.adj = new Map() }
  addVertex(v){ if(!this.adj.has(v)) this.adj.set(v, new Set()) }
  addEdge(a,b){ this.addVertex(a); this.addVertex(b); this.adj.get(a).add(b); this.adj.get(b).add(a) }
  neighbors(v){ return [...(this.adj.get(v)||[]) ] }
  recommend(v){ // recommend sellers 1-hop away that user hasn't transacted with
    const visited = new Set(this.neighbors(v))
    const recs = new Map()
    for(const u of this.neighbors(v)){
      for(const w of this.neighbors(u)){
        if(w!==v && !visited.has(w)){
          recs.set(w, (recs.get(w)||0)+1)
        }
      }
    }
    return [...recs.entries()].sort((a,b)=>b[1]-a[1]).map(([id,count])=>({id, score:count}))
  }
}
