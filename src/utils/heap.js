export class MaxHeap {
  constructor(){ this.data = [] }
  parent(i){ return Math.floor((i-1)/2) }
  left(i){ return 2*i + 1 }
  right(i){ return 2*i + 2 }
  swap(i,j){ [this.data[i], this.data[j]] = [this.data[j], this.data[i]] }
  push(item){
    this.data.push(item)
    this.heapifyUp(this.data.length - 1)
  }
  heapifyUp(i){
    while(i>0 && this.data[this.parent(i)].amount < this.data[i].amount){
      this.swap(i, this.parent(i)); i = this.parent(i)
    }
  }
  pop(){
    if(this.data.length === 0) return null
    const root = this.data[0]
    const end = this.data.pop()
    if(this.data.length>0){ this.data[0] = end; this.heapifyDown(0) }
    return root
  }
  heapifyDown(i){
    while(true){
      const l = this.left(i), r = this.right(i)
      let largest = i
      if(l<this.data.length && this.data[l].amount > this.data[largest].amount) largest = l
      if(r<this.data.length && this.data[r].amount > this.data[largest].amount) largest = r
      if(largest === i) break
      this.swap(i, largest); i = largest
    }
  }
  peek(){ return this.data[0] || null }
  size(){ return this.data.length }
}
