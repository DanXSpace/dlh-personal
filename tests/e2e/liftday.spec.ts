import { expect, test } from '@playwright/test';

// The LiftDay case study on the production build: its two diagrams switch
// between a wide drawing from 768px and a stacked one below, and each keeps a
// text equivalent (design-spec §6).

const diagrams = [
  { name: 'Diagram of the LiftDay iOS app depending on the WorkoutCore Swift package.', label: 'FIG. 04 / APPLICATION ARCHITECTURE' },
  { name: 'Diagram comparing the first and current designs of the AI template builder.', label: 'FIG. 05 / AI TEMPLATE BUILDER' },
];

for (const [width, shown, hidden] of [
  [390, 'd-narrow', 'd-wide'],
  [1024, 'd-wide', 'd-narrow'],
] as const) {
  test(`at ${width}px each diagram shows its ${shown === 'd-wide' ? 'wide' : 'stacked'} drawing`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/work/liftday');
    for (const { name, label } of diagrams) {
      const art = page.getByRole('img', { name });
      await expect(art).toBeVisible();
      await expect(art.locator(`svg.${shown}`)).toBeVisible();
      await expect(art.locator(`svg.${hidden}`)).toBeHidden();
      const figure = page.locator('figure.diagram').filter({ has: art });
      await expect(figure.locator('figcaption')).toContainText(label);
      await expect(figure.getByText('Text description')).toBeVisible();
    }
  });
}
