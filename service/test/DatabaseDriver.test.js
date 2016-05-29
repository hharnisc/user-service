jest.unmock('../src/DatabaseDriver');
import DatabaseDriver from '../src/DatabaseDriver';

describe('DatabaseDriver', () => {
  it('does exist', () => {
    expect(DatabaseDriver).not.toEqual({});
  });
});
