import { cleanup, render } from '@testing-library/react-native';
import { StokOzetiCard } from '../src/components/StokOzetiCard';
import type { InventoryItem } from '../src/types/game';

function stockItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'legacy-duplicate-id',
    name: 'Gram Altın',
    category: 'yatirim',
    karat: 24,
    grams: 1,
    quantity: 1,
    costBasisTl: 5000,
    acquiredDay: 1,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

it('keeps stock preview keys unique for duplicate legacy item ids', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <StokOzetiCard
      items={[
        stockItem(),
        stockItem({ name: 'Çeyrek Altın', grams: 1.75, quantity: 2 }),
      ]}
      onSeeAll={jest.fn()}
    />,
  );

  const duplicateKeyWarnings = consoleError.mock.calls.filter((call) =>
    call.some((part) => String(part).includes('Encountered two children with the same key')),
  );
  expect(duplicateKeyWarnings).toHaveLength(0);
});
