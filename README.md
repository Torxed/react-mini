# react-mini
A React implementation in vanilla JS without Node.js and dependencies

# Example usecase

```html
<script type="text/javascript">
	class TestApp extends Component {
		constructor(dynamic_object) {
			super(dynamic_object)

			this.state = {
				"loggedin" : false,
			}

			return this;
		}

		render() {
			return [
				new React('<input type="text" name="username" id="username">'),
				new React('<input type="password" name="password" id="password">'),
				new React('<button onClick="login();">Login</button>')
			];
		}
	}
	
	window.onload = function() {
		// TODO: Implement JSX?
		let tmp = new React('<TestApp id="testapp" someValue="{moo}" valueTwo="moo">');
		tmp.connect(document.getElementById('someDiv'));

		setInterval(function() {
			tmp.refresh();
		}, 1000)
	}
</script>
