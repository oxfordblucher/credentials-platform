export function LoginForm() {
  return (
    <>
      <form className="justify-center flex flex-col py-4 px-6 rounded-2xl gap-3 border items-center dark:border-gray-700 [&_label_input]:bg-white [&_label_input]:rounded-md [&_label_input]:px-2 [&_label_input]:py-1 [&_label_input]:w-full [&_label_input]:text-black [&_label_input]:box-border">
        <label className="block">Username
          <input type="text" name="username" />
        </label>
        <label className="block">Password
          <input type="password" name="password" />
        </label>
        <div className="flex pt-2 gap-4 *:border *:dark:border-gray-700 *:py-1 *:px-2 *:rounded-md" >
          <a href="/login-help">Can't Login</a>
          <input type="submit" value="Login" />
        </div>
      </form>
    </>
  )
}