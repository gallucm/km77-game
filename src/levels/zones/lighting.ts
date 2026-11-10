import { Color, Entity, FOG_LINEAR } from 'playcanvas';

import type { LevelContext } from '../types';

export function buildLighting(ctx: LevelContext): Record<string, never> {
    const { app, root, sky } = ctx;

    app.scene.fog.type = FOG_LINEAR;
    app.scene.fog.color.copy(sky);
    app.scene.fog.start = 12;
    app.scene.fog.end = 40;
    app.scene.ambientLight = new Color(0.24, 0.3, 0.39);
    const moon = new Entity('Luz de luna');
    moon.addComponent('light', { type: 'directional', color: new Color(0.55, 0.73, 0.99), intensity: 0.73 });
    moon.setEulerAngles(47, -29, 20);
    root.addChild(moon);

    ctx.pointLight('Luz del porche', new Color(1, 0.55, 0.23), [0, 2.2, -5], 2.0, 7);
    ctx.pointLight('Luz interior', new Color(1, 0.66, 0.35), [0, 2.55, -10.5], 2.0, 9);
    ctx.pointLight('Luz del cobertizo', new Color(0.9, 0.82, 0.56), [9, 2.26, -6.5], 1.6, 7);
    const basementLight = ctx.pointLight('Luz del sótano', new Color(0.75, 0.76, 1), [0, -0.24, -23.4], 1.8, 8);
    ctx.basementEntities.push(basementLight);

    return {};
}
