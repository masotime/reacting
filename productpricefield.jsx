    var ProductPriceField = React.createClass({
        getDefaultProps: function() {
            return {
                className: '',
                priceClassName: '',
                priceId: 'itemPrice',
                priceName: 'amount',
                currencyId: 'currencyCode',
                currencyName: 'currency_code',
                currencyClassName: '',
                tooltip: '',
                helpers: []
            }
        },
        render: function () {

            // transfer relevant props
            var price = {
                name: this.props.priceName,
                id: this.props.priceId,
                label: this.props.label,
                placeholder: this.props.placeholder,
                validators: this.props.validators,
                helpers: this.props.helpers,
                className: this.props.priceClassName
            }, currency = {
                name: this.props.currencyName,
                id: this.props.currencyId,
                className: this.props.currencyClassName,
                list: this.props.currencyList,
                selected: this.props.currencySelected
            }, className = this.props.className,
            helpers = this.props.helpers;

            return (
                <div className={className}>
                    <TextField className={price.className}
                        label={price.label}
                        name={price.name}
                        id={price.id}
                        validators={price.validators}
                        helpers={helpers}
                    />
                    <CurrencySelect
                        currencyList={currency.list}
                        selected={currency.selected}
                    />
                </div>
            );
        }
    });

    // corresponds to currencyfield in the paypal project
    var CurrencySelect = React.createClass({
        getDefaultProps: function () {
            return {
                currencyList: [
                    { code: 'USD', symbol_native: '$' }
                ],
                selected: 'USD',
                name: 'currency_code'
            };
        },
        componentWillMount: function() {
            this.setState({
                selected: this.props.selected
            });
        },
        render: function () {
            var selected = this.state.selected, currencyList = this.props.currencyList;

            return (
                <div>
                    <select name={this.props.name} defaultValue={this.props.selected}>
                    {
                        currencyList.map(function(currency) {
                            return <option value={currency.code}>{currency.code}</option>;
                        })
                    }
                    </select>
                </div>
            );
        }
    });