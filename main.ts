module Duvet {
    export const MAIN = new Game(
        "Duvet Loader",
        MetaDataBuilder.build(
            "Chemthunder",
            1.01,
            "ARR",
            "Allows you to load multiple games from one project."
        )
    );
}

module Duvet.API {
    export const carts: Cartridge[] = [];

    export class Cartridge {
        public packet: Payload = new Payload();
        public recordedData: DataCompound;

        public constructor(
            public name: string,
            public color: number
        ) {
            this.recordedData = new DataCompound(this.name);
        }

        public createFile(operation: () => void) {
            this.packet.attach(operation);
        }

        public store(fileLocation: string, data: any) {
            this.recordedData.write(fileLocation, data);
        }

        public read(fileLocation: string): any {
            return this.recordedData.read(fileLocation)
        }

        public open() {
            this.packet.deploy();
            sprites.destroyAllSpritesOfKind(Display);
        }

        public build() {
            carts.push(this);
        }
    }

    export class CartBuilder {
        public operations: Runnable[];

        public constructor(
            public name: string,
            public color: number
        ) {
            this.operations = [];
        }

        public file(operation: () => void): CartBuilder {
            this.operations.push(new Runnable(operation));
            return this;
        }

        public build(): Cartridge {
            const built = new Cartridge(this.name, this.color);
            for (let op of this.operations) {
                built.createFile(() => op.run());
            }
            built.build();
            return built;
        }
    }
}

module Duvet.Carts {
    export const DuvetLoader: API.Cartridge = new API.CartBuilder("Duvet Loader", game.Color.Yellow)
        .file(() => print("Loaded Duvet external"))
        .build();
}

module Duvet {
    export const Display = SpriteKind.create();

    export const depot = new PipelineDepo();

    export class Primary implements Pipeline {
        Begin: Payload = new Payload();
        Render: Payload = new Payload();

        public index: number = 0;
        public appOpen: boolean = false;

        public constructor() { }

        public assemble() {
            this.Begin.attach(() => { // Primary script
                enablePrint();

                for (let appl of API.carts) {
                    print("Loaded", appl.name);
                }

                this.update();
                game.consoleOverlay.setVisible(false, 1);
            });
            this.Begin.attach(() => {
                controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
                    if (!this.appOpen) {
                        if (this.index < API.carts.length - 1) {
                            this.index++;
                        } else {
                            this.index = 0;
                        }

                        sprites.destroyAllSpritesOfKind(Display);
                        this.update();
                    }
                });

                controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
                    if (!this.appOpen) {
                        if (this.index > 0) {
                            this.index--;
                        } else {
                            this.index = API.carts.length - 1;
                        }

                        sprites.destroyAllSpritesOfKind(Display);
                        this.update();
                    }
                });

                controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
                    if (!this.appOpen) {
                        const index = API.carts.get(this.index);

                        this.appOpen = true;
                        game.consoleOverlay.clear();

                        index.open();
                    }
                });
            });

            this.Render.attach(() => {
                scene.createRenderable(500, (handler, cam) => {
                    const toDraw = API.carts.get(this.index);
                    const list = API.carts;

                    handler.printCenter(
                        toDraw.name,
                        20,
                        1
                    );

                    handler.printCenter(
                        `${this.index + 1}/${list.length}`,
                        screen.height - 25,
                        1
                    );

                    handler.print(
                        `Duvet Loader #${MAIN.getMetaData().getVersion()}`,
                        0,
                        screen.height - 10,
                        1
                    );
                }, () => !this.appOpen);
            });
        }

        public update() {
            const toDraw = API.carts.get(this.index);
            const disp = sprites.create(
                createImage(
                    16,
                    32,
                    toDraw.color
                ),
                Display
            );
        }

        public getPayloads(): Payload[] {
            return [
                this.Begin,
                this.Render
            ];
        }

        public getId(): string {
            return "Primary"
        }
    }

    depot.loadSingular(new Primary());
    depot.bootstrap();
}