import Gverse from "../../gverse"

export const conn = new Gverse.Connection({
  host: "server",
  port: 9080,
  debug: false
})

export const graph = new Gverse.Graph(conn)

export class Pet extends Gverse.Vertex {
  type = Pet.name
  name: string = ""
  name$ur: string = ""
  breed: string = ""
  origin?: Origin
  owner?: Owner
  beforeCreateSet = false
  afterCreateSet = false
  beforeUpdateSet = false
  afterUpdateSet = false
  beforeDeleteSet = false
  afterDeleteSet = false

  _edges: any = {
    owner: Gverse.Edge.toVertex(Owner),
    origin: Gverse.Edge.toVertex(Origin)
  }

  static create(name: string, breed: string): Pet {
    const pet = new Pet()
    pet.name = name
    pet.breed = breed
    return pet
  }
  async getAdoptedBy(owner: Owner): Promise<Pet> {
    await graph.link(this, owner, "owner")
    const updated = await this.loadFrom(graph)
    return updated as Pet
  }
  async escape(owner: Owner): Promise<Pet> {
    await graph.unlink(this, owner, "owner")
    const updated = await this.loadFrom(graph)
    return updated as Pet
  }
  async beforeCreate() {
    this.beforeCreateSet = true
  }
  async afterCreate() {
    this.afterCreateSet = true
  }
  async beforeUpdate() {
    this.beforeUpdateSet = true
  }
  async afterUpdate() {
    this.afterUpdateSet = true
  }
  async beforeDelete() {
    this.beforeDeleteSet = true
  }
  async afterDelete() {
    this.afterDeleteSet = true
  }
  // async loadFrom(graph: Gverse.Graph): Promise<Pet> {
  //   return graph.load(this) as Pet
  // }
}

export class Owner extends Gverse.Vertex {
  type = Owner.name
  name: string = ""
  pets?: Pet[]
  _edges: any = {
    pets: Gverse.Edge.toVertices(Pet)
    // @todo pets: Gverse.Edge.fromVertices(Pet, "owner")
  }
  static create(name: string): Owner {
    const owner = new Owner()
    owner.name = name
    return owner
  }
}

export class Origin extends Gverse.Vertex {
  type = Origin.name
  name: string = ""
  pets: Pet[] = []
  _edges: any = {
    pets: Gverse.Edge.toVertices(Pet, { reverseOf: "origin" })
  }
  static create(name: string): Origin {
    return new Origin().unmarshal({ name: "Toronoto" })
  }
}

export class VertexFixtures {
  public pet?: Pet
  public owner?: Owner
  public origin?: Origin

  private async clear() {
    await conn.clear(Pet.name)
    await conn.clear(Owner.name)
    const indices =
      "name: string @index(exact) @lang . \n" + "<origin>: uid @reverse . \n"
    const types = `
      type Origin {
        name
        <~origin>
      }
      type Owner {
        name
      }
      type Pet {
        name
        breed
        owner
        origin
      }
    `
    await conn.applySchema(indices + types)
  }

  async build() {
    await this.clear()
    this.pet = (await graph.create(Pet.create("Biggles", "Cat"))) as Pet
    this.owner = (await graph.create(Owner.create("Austin"))) as Owner
    this.origin = (await graph.create(Origin.create("Toronto"))) as Origin
    return this
  }
}
