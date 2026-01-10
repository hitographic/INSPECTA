
import { useState, useEffect } from 'react'
import supabase from './utils/supabase'


function Page() {
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    async function getTodos() {
      const { data: todos } = await supabase.from('todos').select()
      if (todos && todos.length > 0) {
        setTodos(todos)
      }
    }
    getTodos()
  }, [])

  return (
    <div>
      {todos.map((todo: any) => (
        <li key={todo.id || todo}>{JSON.stringify(todo)}</li>
      ))}
    </div>
  )
}

export default Page