import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { JewelryPieceSpec, JewelryTierSpec } from '../data/jewelryInvestments';
import { colors, fonts, fontSizes, radius } from '../theme';
import { formatTl } from '../utils/format';
import { Badge } from './Badge';
import { Card } from './Card';

// [YENİ] v3 — Takı Yatırımı (Parça & Set) kartı: bir ayar kademesindeki 4
// parçayı (Kolye/Yüzük/Küpe/Bileklik) tek tek gösterir; hepsi sahiplenilince
// Set Bonusu rozeti belirir.
export function JewelryTierCard({
  tier,
  pieces,
  ownedPieces,
  piecePriceTl,
  pieceDailyReturnTl,
  hasSetBonus,
  canAfford,
  locked,
  requiredLevel,
  onBuyPiece,
}: {
  tier: JewelryTierSpec;
  pieces: JewelryPieceSpec[];
  ownedPieces: Record<string, boolean>;
  piecePriceTl: number;
  pieceDailyReturnTl: number;
  hasSetBonus: boolean;
  canAfford: boolean;
  locked?: boolean;
  requiredLevel?: number;
  onBuyPiece: (pieceId: string) => void;
}) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{tier.label}</Text>
        {hasSetBonus && <Badge tone="positive" label="Set Bonusu +%10" />}
      </View>
      {locked ? (
        <Text style={styles.meta}>Kilitli — Seviye {requiredLevel} gerekiyor</Text>
      ) : (
        <Text style={styles.meta}>
          Parça {formatTl(piecePriceTl)} · Günlük {formatTl(pieceDailyReturnTl)}/parça
        </Text>
      )}
      <View style={styles.piecesRow}>
        {pieces.map((piece) => {
          const owned = !!ownedPieces[piece.id];
          return (
            <Pressable
              key={piece.id}
              disabled={locked || owned || !canAfford}
              onPress={() => onBuyPiece(piece.id)}
              style={[
                styles.pieceButton,
                owned && styles.pieceButtonOwned,
                (locked || (!owned && !canAfford)) && styles.disabled,
              ]}
            >
              <Text style={[styles.pieceLabel, owned && styles.pieceLabelOwned]}>{piece.label}</Text>
              <Text style={[styles.pieceStatus, owned && styles.pieceLabelOwned]}>
                {owned ? 'Sahip' : locked ? '—' : 'Satın Al'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    marginTop: 4,
  },
  piecesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  pieceButton: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceSunken,
  },
  pieceButtonOwned: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.4,
  },
  pieceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.ink,
  },
  pieceLabelOwned: {
    color: colors.accentDark,
  },
  pieceStatus: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
