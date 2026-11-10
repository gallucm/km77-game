import { Color, Entity, Layer } from 'playcanvas';
import type { AppBase, ContainerResource, RenderComponent } from 'playcanvas';

export function createPlayerArms(app: AppBase, camera: Entity, model: ContainerResource) {
    const layer = new Layer({ name: 'Brazos FPS' });
    app.scene.layers.push(layer);

    const view = new Entity('Cámara de brazos');
    view.addComponent('camera', {
        layers: [layer.id],
        priority: 1,
        clearColorBuffer: false,
        clearDepthBuffer: true,
        fov: 52,
        nearClip: 0.04,
        farClip: 3
    });
    camera.addChild(view);

    const light = new Entity('Luz suave de brazos');
    light.addComponent('light', {
        type: 'directional',
        layers: [layer.id],
        color: new Color(0.74, 0.78, 0.86),
        intensity: 0.65
    });
    light.setLocalEulerAngles(-38, -25, 0);
    view.addChild(light);

    const rig = new Entity('Brazos del jugador');
    const restHeight = 0.035;
    rig.setLocalPosition(0, restHeight, 0);
    const visual = model.instantiateRenderEntity();
    for (const render of visual.findComponents('render') as RenderComponent[]) {
        render.layers = [layer.id];
        render.castShadows = false;
    }
    rig.addChild(visual);
    view.addChild(rig);
    view.enabled = false;

    const left = visual.findByName('brazo_izquierdo');
    const right = visual.findByName('brazo_derecho');
    const leftRest = left?.getLocalRotation().clone();
    const rightRest = right?.getLocalRotation().clone();
    let phase = 0;
    let blend = 0;

    return {
        setActive(active: boolean) {
            view.enabled = active;
            if (!active) {
                phase = 0;
                blend = 0;
            }
        },
        update(dt: number, speed: number) {
            blend += (Math.min(speed / 3.2, 1.25) - blend) * (1 - Math.exp(-dt * 10));
            phase += dt * (5.8 + 0.6 * speed);
            const swing = Math.sin(phase) * blend;
            rig.setLocalPosition(swing * 0.008, restHeight - Math.abs(swing) * 0.012, 0);
            rig.setLocalEulerAngles(0, 0, swing * 0.75);
            if (left && leftRest) {
                left.setLocalRotation(leftRest);
                left.rotateLocal(swing * 2.5, 0, 0);
            }
            if (right && rightRest) {
                right.setLocalRotation(rightRest);
                right.rotateLocal(-swing * 2.5, 0, 0);
            }
        }
    };
}
