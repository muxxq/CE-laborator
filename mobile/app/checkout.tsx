import { DeliveryStep } from '@/components/checkout/delivery-step';
import { PaymentStep } from '@/components/checkout/payment-step';
import { ShippingStep } from '@/components/checkout/shipping-step';
import { Colors, FontFamily } from '@/constants/theme';
import { useCart } from '@/context/cart-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sdk } from '@/lib/sdk';
import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

type CheckoutStep = 'delivery' | 'shipping' | 'payment';

// Etichetele pașilor afișate în română (cheile rămân în engleză, logica depinde de ele)
const STEP_LABELS: Record<CheckoutStep, string> = {
  delivery: 'Adresă',
  shipping: 'Livrare',
  payment: 'Plată',
};

export default function CheckoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { cart, refreshCart } = useCart();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [loading, setLoading] = useState(false);

  // Contact & Address state
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    countryCode: '',
    phone: '',
  });
  const [useSameForBilling, setUseSameForBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    countryCode: '',
    phone: '',
  });

  // Shipping step
  const [shippingOptions, setShippingOptions] = useState<HttpTypes.StoreCartShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string | null>(null);

  // Payment step
  const [paymentProviders, setPaymentProviders] = useState<HttpTypes.StorePaymentProvider[]>([]);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<string | null>(null);

  // Sync form state with cart values (handles both prepopulation and reset)
  useEffect(() => {
    // Populate form with existing cart data or reset to empty values
    setEmail(cart?.email || '');
    setShippingAddress({
      firstName: cart?.shipping_address?.first_name || '',
      lastName: cart?.shipping_address?.last_name || '',
      address: cart?.shipping_address?.address_1 || '',
      city: cart?.shipping_address?.city || '',
      postalCode: cart?.shipping_address?.postal_code || '',
      countryCode: cart?.shipping_address?.country_code || '',
      phone: cart?.shipping_address?.phone || '',
    });
    
    // Billing address - check if different from shipping
    const hasDifferentBilling = cart?.billing_address && 
      (cart.billing_address.address_1 !== cart.shipping_address?.address_1 ||
       cart.billing_address.city !== cart.shipping_address?.city);
    
    setUseSameForBilling(!hasDifferentBilling);
    setBillingAddress({
      firstName: cart?.billing_address?.first_name || '',
      lastName: cart?.billing_address?.last_name || '',
      address: cart?.billing_address?.address_1 || '',
      city: cart?.billing_address?.city || '',
      postalCode: cart?.billing_address?.postal_code || '',
      countryCode: cart?.billing_address?.country_code || '',
      phone: cart?.billing_address?.phone || '',
    });
    
    // Reset selections when cart is null
    if (!cart) {
      setSelectedShippingOption(null);
      setSelectedPaymentProvider(null);
      setCurrentStep('delivery');
    }
  }, [cart]);

  const fetchShippingOptions = useCallback(async () => {
    if (!cart) return;

    try {
      setLoading(true);
      const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
        cart_id: cart.id,
      });
      setShippingOptions(shipping_options || []);
    } catch (err) {
      console.error('Failed to fetch shipping options:', err);
      Alert.alert('Eroare', 'Opțiunile de livrare nu au putut fi încărcate');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const fetchPaymentProviders = useCallback(async () => {
    if (!cart) return;

    try {
      setLoading(true);
      const { payment_providers } = await sdk.store.payment.listPaymentProviders({
        region_id: cart.region_id || '',
      });
      setPaymentProviders(payment_providers || []);
    } catch (err) {
      console.error('Failed to fetch payment providers:', err);
      Alert.alert('Eroare', 'Metodele de plată nu au putut fi încărcate');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  useEffect(() => {
    if (currentStep === 'shipping') {
      fetchShippingOptions();
    } else if (currentStep === 'payment') {
      fetchPaymentProviders();
    }
  }, [currentStep, fetchShippingOptions, fetchPaymentProviders]);

  const handleDeliveryNext = async () => {
    // Validate shipping address
    if (!email || !shippingAddress.firstName || !shippingAddress.lastName || 
        !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || 
        !shippingAddress.countryCode || !shippingAddress.phone) {
      Alert.alert('Eroare', 'Completează toate câmpurile adresei de livrare');
      return;
    }

    // Validate billing address if different
    if (!useSameForBilling) {
      if (!billingAddress.firstName || !billingAddress.lastName || !billingAddress.address || 
          !billingAddress.city || !billingAddress.postalCode || !billingAddress.countryCode || 
          !billingAddress.phone) {
        Alert.alert('Eroare', 'Completează toate câmpurile adresei de facturare');
        return;
      }
    }

    if (!cart) return;

    try {
      setLoading(true);
      const shippingAddressData = {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        address_1: shippingAddress.address,
        city: shippingAddress.city,
        postal_code: shippingAddress.postalCode,
        country_code: shippingAddress.countryCode,
        phone: shippingAddress.phone,
      };

      const billingAddressData = useSameForBilling ? shippingAddressData : {
        first_name: billingAddress.firstName,
        last_name: billingAddress.lastName,
        address_1: billingAddress.address,
        city: billingAddress.city,
        postal_code: billingAddress.postalCode,
        country_code: billingAddress.countryCode,
        phone: billingAddress.phone,
      };

      await sdk.store.cart.update(cart.id, {
        email,
        shipping_address: shippingAddressData,
        billing_address: billingAddressData,
      });

      await refreshCart();
      setCurrentStep('shipping');
    } catch (err) {
      console.error('Failed to update cart:', err);
      Alert.alert('Eroare', 'Datele de livrare nu au putut fi salvate');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingNext = async () => {
    if (!selectedShippingOption || !cart) {
      Alert.alert('Eroare', 'Alege o metodă de livrare');
      return;
    }

    try {
      setLoading(true);

      await sdk.store.cart.addShippingMethod(cart.id, {
        option_id: selectedShippingOption,
      });

      await refreshCart();
      setCurrentStep('payment');
    } catch (err) {
      console.error('Failed to add shipping method:', err);
      Alert.alert('Eroare', 'Metoda de livrare nu a putut fi salvată');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentProvider || !cart) {
      Alert.alert('Eroare', 'Alege o metodă de plată');
      return;
    }

    try {
      setLoading(true);

      // Create payment session
      await sdk.store.payment.initiatePaymentSession(cart, {
        provider_id: selectedPaymentProvider,
      });

      // Complete cart (converts cart to order on backend)
      const result = await sdk.store.cart.complete(cart.id);

      if (result.type === 'order') {
        // Navigate to order confirmation first
        // Cart will be cleared on the order confirmation page to prevent empty cart flash
        router.replace(`/order-confirmation/${result.order.id}`);
      } else {
        Alert.alert('Eroare', result.error?.message || 'Comanda nu a putut fi finalizată');
      }
    } catch (err: any) {
      console.error('Failed to complete order:', err);
      Alert.alert('Eroare', err?.message || 'Comanda nu a putut fi finalizată');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Nu există niciun coș. Adaugă mai întâi produse în coș.
        </Text>
      </View>
    );
  }

  // Pasul activ: fundal teracotă, text în culoarea potrivită temei
  const activeStepBg = colors.tint;
  const activeStepText = colors.onTint;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.steps, { borderBottomColor: colors.border }]}>
        {(['delivery', 'shipping', 'payment'] as CheckoutStep[]).map((step, index) => (
          <View key={step} style={styles.stepIndicator}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    currentStep === step ? activeStepBg : colors.icon + '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  { color: currentStep === step ? activeStepText : colors.icon },
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color: currentStep === step ? colors.text : colors.icon,
                  fontFamily: currentStep === step ? FontFamily.semiBold : FontFamily.regular,
                },
              ]}
            >
              {STEP_LABELS[step]}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.content}>
        {currentStep === 'delivery' && (
          <DeliveryStep
            email={email}
            shippingAddress={shippingAddress}
            billingAddress={billingAddress}
            useSameForBilling={useSameForBilling}
            loading={loading}
            onEmailChange={setEmail}
            onShippingAddressChange={(field, value) => 
              setShippingAddress(prev => ({ ...prev, [field]: value }))
            }
            onBillingAddressChange={(field, value) => 
              setBillingAddress(prev => ({ ...prev, [field]: value }))
            }
            onUseSameForBillingChange={setUseSameForBilling}
            onNext={handleDeliveryNext}
          />
        )}

        {currentStep === 'shipping' && (
          <ShippingStep
            shippingOptions={shippingOptions}
            selectedShippingOption={selectedShippingOption}
            currencyCode={cart.currency_code}
            loading={loading}
            onSelectOption={setSelectedShippingOption}
            onBack={() => setCurrentStep('delivery')}
            onNext={handleShippingNext}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentStep
            cart={cart}
            paymentProviders={paymentProviders}
            selectedPaymentProvider={selectedPaymentProvider}
            loading={loading}
            onSelectProvider={setSelectedPaymentProvider}
            onBack={() => setCurrentStep('shipping')}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  content: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
});

