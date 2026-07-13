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
        .file(() => {
            print("Hi");
        })
        .build();
}

module Duvet {
    export const Display = SpriteKind.create();

    export const depot = new PipelineDepo();

    export class Primary implements Pipeline {
        Begin: Payload = new Payload();

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
        }

        public update() {
            const toDraw = API.carts.get(this.index);
            const disp = sprites.create(createImage(16, 32, toDraw.color), Display);

            disp.sayText(toDraw.name);
        }

        public getPayloads(): Payload[] {
            return [
                this.Begin
            ];
        }

        public getId(): string {
            return "Primary"
        }
    }

    depot.loadSingular(new Primary());
    depot.bootstrap();
}